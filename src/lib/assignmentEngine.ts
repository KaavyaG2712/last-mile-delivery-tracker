import { AgentCandidate, ZoneData } from './types';
import { calculateHaversineDistance } from './geo';
import { PrismaClient } from '@prisma/client';

export interface AssignmentResult {
  success: boolean;
  assignedAgent: AgentCandidate | null;
  strategyUsed: 'PRIMARY_ZONE_PROXIMITY' | 'PRIMARY_ZONE_LOAD' | 'ADJACENT_ZONE_FALLBACK' | 'GLOBAL_LEAST_LOAD' | 'NONE';
  reason?: string;
  distanceKm?: number;
  evaluatedCandidatesCount: number;
}

/**
 * Pure selection heuristic for ranking and finding the optimal delivery agent.
 * Combines Haversine distance, zone locality, and payload balancing.
 */
export function findBestAgentCandidate(
  pickupLat: number | null,
  pickupLng: number | null,
  pickupZone: ZoneData,
  allActiveAgents: AgentCandidate[],
  allZones: ZoneData[]
): { candidate: AgentCandidate | null; strategy: AssignmentResult['strategyUsed']; distanceKm?: number } {
  const availableAgents = allActiveAgents.filter(
    (a) => a.status === 'AVAILABLE' && a.currentLoad < a.maxCapacity
  );

  if (availableAgents.length === 0) {
    return { candidate: null, strategy: 'NONE' };
  }

  // 1. Primary: Agents located in the exact pickup zone
  const intraZoneAgents = availableAgents.filter(
    (a) => a.currentZoneId === pickupZone.id || a.zoneCode === pickupZone.code
  );

  if (intraZoneAgents.length > 0) {
    // If we have coordinates for pickup and agent, sort by Haversine distance + load factor
    if (pickupLat != null && pickupLng != null) {
      const ranked = intraZoneAgents.map((agent) => {
        const agentLat = agent.lat ?? pickupZone.centerLat;
        const agentLng = agent.lng ?? pickupZone.centerLng;
        const distanceKm = calculateHaversineDistance(pickupLat, pickupLng, agentLat, agentLng);
        // Composite score: distance (weight 0.6) + load penalty (weight 1.5 per active delivery)
        const score = distanceKm * 0.6 + agent.currentLoad * 1.5;
        return { agent, distanceKm, score };
      });

      ranked.sort((a, b) => a.score - b.score);
      return {
        candidate: ranked[0].agent,
        strategy: 'PRIMARY_ZONE_PROXIMITY',
        distanceKm: ranked[0].distanceKm,
      };
    }

    // Fallback within zone: lowest active load
    intraZoneAgents.sort((a, b) => a.currentLoad - b.currentLoad);
    return { candidate: intraZoneAgents[0], strategy: 'PRIMARY_ZONE_LOAD' };
  }

  // 2. Fallback: Agents in adjacent zones
  const adjacentCodes = pickupZone.adjacentZoneCodes || [];
  const adjacentZones = allZones.filter((z) => adjacentCodes.includes(z.code));
  const adjacentZoneIds = adjacentZones.map((z) => z.id);

  const adjacentAgents = availableAgents.filter(
    (a) =>
      (a.currentZoneId && adjacentZoneIds.includes(a.currentZoneId)) ||
      (a.zoneCode && adjacentCodes.includes(a.zoneCode))
  );

  if (adjacentAgents.length > 0) {
    if (pickupLat != null && pickupLng != null) {
      const ranked = adjacentAgents.map((agent) => {
        const zoneMatch = allZones.find((z) => z.id === agent.currentZoneId || z.code === agent.zoneCode);
        const agentLat = agent.lat ?? (zoneMatch ? zoneMatch.centerLat : pickupZone.centerLat);
        const agentLng = agent.lng ?? (zoneMatch ? zoneMatch.centerLng : pickupZone.centerLng);
        const distanceKm = calculateHaversineDistance(pickupLat, pickupLng, agentLat, agentLng);
        const score = distanceKm * 0.8 + agent.currentLoad * 2.0;
        return { agent, distanceKm, score };
      });

      ranked.sort((a, b) => a.score - b.score);
      return {
        candidate: ranked[0].agent,
        strategy: 'ADJACENT_ZONE_FALLBACK',
        distanceKm: ranked[0].distanceKm,
      };
    }

    adjacentAgents.sort((a, b) => a.currentLoad - b.currentLoad);
    return { candidate: adjacentAgents[0], strategy: 'ADJACENT_ZONE_FALLBACK' };
  }

  // 3. Fallback: Any active agent with lowest payload
  availableAgents.sort((a, b) => a.currentLoad - b.currentLoad);
  return { candidate: availableAgents[0], strategy: 'GLOBAL_LEAST_LOAD' };
}

/**
 * Concurrency-safe atomic transaction for assigning an agent to an order.
 * Uses Prisma interactive transactions to prevent race conditions when two concurrent orders attempt
 * to claim the same agent capacity simultaneously.
 */
export async function executeAtomicAgentAssignment(
  prisma: PrismaClient,
  orderId: string,
  targetAgentId?: string | null,
  actorId?: string | null,
  actorRole: 'SYSTEM' | 'ADMIN' | 'AGENT' = 'SYSTEM',
  customNotes?: string
): Promise<AssignmentResult> {
  return await prisma.$transaction(
    async (tx) => {
      // 1. Fetch order with exclusive row context
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          pickupZone: true,
          assignedAgent: true,
        },
      });

      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      // If specific agent requested (manual assignment)
      if (targetAgentId) {
        const targetAgent = await tx.user.findUnique({
          where: { id: targetAgentId },
          include: { currentZone: true },
        });

        if (!targetAgent || targetAgent.role !== 'AGENT') {
          throw new Error('Designated user is not an active delivery agent');
        }

        if (targetAgent.currentLoad >= targetAgent.maxCapacity) {
          throw new Error(`Agent ${targetAgent.name} has reached maximum delivery capacity (${targetAgent.maxCapacity})`);
        }

        // Decrement previous agent's load if reassigning
        if (order.assignedAgentId && order.assignedAgentId !== targetAgentId) {
          await tx.user.update({
            where: { id: order.assignedAgentId },
            data: { currentLoad: { decrement: 1 } },
          });
        }

        // Increment new agent's load if not already assigned
        if (order.assignedAgentId !== targetAgentId) {
          await tx.user.update({
            where: { id: targetAgentId },
            data: { currentLoad: { increment: 1 } },
          });
        }

        // Update order
        const updatedOrder = await tx.order.update({
          where: { id: orderId },
          data: {
            assignedAgentId: targetAgentId,
          },
        });

        // Log immutable audit trail
        await tx.orderStatusLog.create({
          data: {
            orderId: order.id,
            previousStatus: order.status,
            newStatus: updatedOrder.status,
            actorId: actorId || null,
            actorRole,
            notes: customNotes || `Manually assigned to agent ${targetAgent.name} (${targetAgent.email})`,
          },
        });

        return {
          success: true,
          assignedAgent: {
            id: targetAgent.id,
            name: targetAgent.name,
            email: targetAgent.email,
            phone: targetAgent.phone,
            currentZoneId: targetAgent.currentZoneId,
            zoneCode: targetAgent.currentZone?.code || null,
            status: targetAgent.status,
            lat: targetAgent.lat,
            lng: targetAgent.lng,
            maxCapacity: targetAgent.maxCapacity,
            currentLoad: targetAgent.currentLoad + 1,
          },
          strategyUsed: 'NONE',
          evaluatedCandidatesCount: 1,
        };
      }

      // Auto-assignment flow:
      const allZonesRaw = await tx.zone.findMany();
      const allZones: ZoneData[] = allZonesRaw.map((z) => ({
        id: z.id,
        code: z.code,
        name: z.name,
        pincodes: z.pincodes.split(',').map((p) => p.trim()),
        adjacentZoneCodes: z.adjacentZoneCodes.split(',').map((p) => p.trim()).filter(Boolean),
        centerLat: z.centerLat,
        centerLng: z.centerLng,
      }));

      const pickupZone = allZones.find((z) => z.id === order.pickupZoneId || z.code === order.pickupZone?.code);
      if (!pickupZone) {
        throw new Error(`Cannot auto-assign: Pickup zone for order ${orderId} is not configured`);
      }

      const allActiveAgentsRaw = await tx.user.findMany({
        where: {
          role: 'AGENT',
          status: 'AVAILABLE',
        },
        include: { currentZone: true },
      });

      const candidatePool: AgentCandidate[] = allActiveAgentsRaw.map((a) => ({
        id: a.id,
        name: a.name,
        email: a.email,
        phone: a.phone,
        currentZoneId: a.currentZoneId,
        zoneCode: a.currentZone?.code || null,
        status: a.status,
        lat: a.lat,
        lng: a.lng,
        maxCapacity: a.maxCapacity,
        currentLoad: a.currentLoad,
      }));

      const selection = findBestAgentCandidate(
        order.pickupLat,
        order.pickupLng,
        pickupZone,
        candidatePool,
        allZones
      );

      if (!selection.candidate) {
        return {
          success: false,
          assignedAgent: null,
          strategyUsed: 'NONE',
          reason: 'No available delivery agents found within capacity in pickup or adjacent zones',
          evaluatedCandidatesCount: candidatePool.length,
        };
      }

      const chosenAgent = selection.candidate;

      // Decrement previous agent's load if reassigning
      if (order.assignedAgentId && order.assignedAgentId !== chosenAgent.id) {
        await tx.user.update({
          where: { id: order.assignedAgentId },
          data: { currentLoad: { decrement: 1 } },
        });
      }

      // Increment chosen agent load atomically
      if (order.assignedAgentId !== chosenAgent.id) {
        await tx.user.update({
          where: { id: chosenAgent.id },
          data: { currentLoad: { increment: 1 } },
        });
      }

      // Update order
      await tx.order.update({
        where: { id: orderId },
        data: {
          assignedAgentId: chosenAgent.id,
        },
      });

      // Immutable log
      await tx.orderStatusLog.create({
        data: {
          orderId: order.id,
          previousStatus: order.status,
          newStatus: order.status,
          actorId: actorId || null,
          actorRole,
          notes: `Smart Auto-Assignment: Matched agent ${chosenAgent.name} using ${selection.strategy}${
            selection.distanceKm != null ? ` (~${selection.distanceKm} km away)` : ''
          }`,
        },
      });

      return {
        success: true,
        assignedAgent: chosenAgent,
        strategyUsed: selection.strategy,
        distanceKm: selection.distanceKm,
        evaluatedCandidatesCount: candidatePool.length,
      };
    },
    {
      maxWait: 5000,
      timeout: 10000,
    }
  );
}
