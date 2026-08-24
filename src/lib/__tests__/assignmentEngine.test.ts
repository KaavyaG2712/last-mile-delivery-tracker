import { calculateHaversineDistance } from '../geo';
import { findBestAgentCandidate } from '../assignmentEngine';
import { AgentCandidate, ZoneData } from '../types';

export function runAssignmentEngineTests(): { passed: number; failed: number; errors: string[] } {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      passed++;
      console.log(`  ✓ ${testName}`);
    } else {
      failed++;
      const msg = `  ✗ ${testName} ${detail ? `(${detail})` : ''}`;
      console.error(msg);
      errors.push(msg);
    }
  }

  console.log('\n--- 🧪 TEST SUITE: SMART AUTO-ASSIGNMENT & HAVERSINE ---');

  // Test 1: Haversine distance accuracy
  try {
    // Distance from North Delhi (28.7041, 77.1025) to South Delhi (28.5355, 77.2410) ~ 23.3 km
    const dist = calculateHaversineDistance(28.7041, 77.1025, 28.5355, 77.241);
    assert(dist > 22.0 && dist < 25.0, `Haversine: North to South Delhi is ~23.3 km (Got ${dist} km)`);

    // Zero distance for identical points
    const zeroDist = calculateHaversineDistance(28.6139, 77.209, 28.6139, 77.209);
    assert(zeroDist === 0, 'Haversine: Identical coordinates return 0 km');
  } catch (err: any) {
    assert(false, 'Haversine distance crashed', err.message);
  }

  // Test 2: Primary Zone Matching & Proximity
  try {
    const zoneNorth: ZoneData = {
      id: 'z_north',
      code: 'ZONE_NORTH',
      name: 'North Cluster',
      pincodes: ['110001', '110007'],
      adjacentZoneCodes: ['ZONE_CENTRAL'],
      centerLat: 28.7041,
      centerLng: 77.1025,
    };

    const zoneCentral: ZoneData = {
      id: 'z_central',
      code: 'ZONE_CENTRAL',
      name: 'Central Cluster',
      pincodes: ['110002'],
      adjacentZoneCodes: ['ZONE_NORTH'],
      centerLat: 28.6139,
      centerLng: 77.209,
    };

    const agents: AgentCandidate[] = [
      {
        id: 'agent_north_1',
        name: 'Rahul (North)',
        email: 'rahul@test.com',
        currentZoneId: 'z_north',
        zoneCode: 'ZONE_NORTH',
        status: 'AVAILABLE',
        lat: 28.705,
        lng: 77.103,
        maxCapacity: 10,
        currentLoad: 2,
      },
      {
        id: 'agent_central_1',
        name: 'Priya (Central)',
        email: 'priya@test.com',
        currentZoneId: 'z_central',
        zoneCode: 'ZONE_CENTRAL',
        status: 'AVAILABLE',
        lat: 28.614,
        lng: 77.21,
        maxCapacity: 10,
        currentLoad: 0,
      },
    ];

    // Pickup in North zone (28.7041, 77.1025)
    const result = findBestAgentCandidate(28.7041, 77.1025, zoneNorth, agents, [zoneNorth, zoneCentral]);
    assert(result.candidate?.id === 'agent_north_1', 'Auto-Assign: Prioritizes intra-zone agent over adjacent zone');
    assert(result.strategy === 'PRIMARY_ZONE_PROXIMITY', 'Auto-Assign: Uses PRIMARY_ZONE_PROXIMITY strategy');
  } catch (err: any) {
    assert(false, 'Primary zone match crashed', err.message);
  }

  // Test 3: Adjacent Zone Fallback when Primary Zone is busy/empty
  try {
    const zoneNorth: ZoneData = {
      id: 'z_north',
      code: 'ZONE_NORTH',
      name: 'North Cluster',
      pincodes: ['110001'],
      adjacentZoneCodes: ['ZONE_CENTRAL'],
      centerLat: 28.7041,
      centerLng: 77.1025,
    };

    const zoneCentral: ZoneData = {
      id: 'z_central',
      code: 'ZONE_CENTRAL',
      name: 'Central Cluster',
      pincodes: ['110002'],
      adjacentZoneCodes: ['ZONE_NORTH'],
      centerLat: 28.6139,
      centerLng: 77.209,
    };

    const zoneSouth: ZoneData = {
      id: 'z_south',
      code: 'ZONE_SOUTH',
      name: 'South Cluster',
      pincodes: ['110016'],
      adjacentZoneCodes: [],
      centerLat: 28.5355,
      centerLng: 77.241,
    };

    // No North agents available; Central is adjacent; South is non-adjacent
    const agents: AgentCandidate[] = [
      {
        id: 'agent_central_1',
        name: 'Priya (Central Adjacent)',
        email: 'priya@test.com',
        currentZoneId: 'z_central',
        zoneCode: 'ZONE_CENTRAL',
        status: 'AVAILABLE',
        lat: 28.614,
        lng: 77.21,
        maxCapacity: 10,
        currentLoad: 1,
      },
      {
        id: 'agent_south_1',
        name: 'David (South Non-Adjacent)',
        email: 'david@test.com',
        currentZoneId: 'z_south',
        zoneCode: 'ZONE_SOUTH',
        status: 'AVAILABLE',
        lat: 28.5355,
        lng: 77.241,
        maxCapacity: 10,
        currentLoad: 0,
      },
    ];

    const result = findBestAgentCandidate(28.7041, 77.1025, zoneNorth, agents, [zoneNorth, zoneCentral, zoneSouth]);
    assert(result.candidate?.id === 'agent_central_1', 'Auto-Assign: Falls back to adjacent zone agent');
    assert(result.strategy === 'ADJACENT_ZONE_FALLBACK', 'Auto-Assign: Strategy is ADJACENT_ZONE_FALLBACK');
  } catch (err: any) {
    assert(false, 'Adjacent zone fallback crashed', err.message);
  }

  // Test 4: Capacity limit rejection
  try {
    const zoneNorth: ZoneData = {
      id: 'z_north',
      code: 'ZONE_NORTH',
      name: 'North Cluster',
      pincodes: ['110001'],
      adjacentZoneCodes: [],
      centerLat: 28.7041,
      centerLng: 77.1025,
    };

    const fullAgents: AgentCandidate[] = [
      {
        id: 'agent_full',
        name: 'Busy Agent',
        email: 'busy@test.com',
        currentZoneId: 'z_north',
        zoneCode: 'ZONE_NORTH',
        status: 'AVAILABLE',
        lat: 28.705,
        lng: 77.103,
        maxCapacity: 5,
        currentLoad: 5, // Full capacity!
      },
    ];

    const result = findBestAgentCandidate(28.7041, 77.1025, zoneNorth, fullAgents, [zoneNorth]);
    assert(result.candidate === null, 'Auto-Assign: Rejects agent who reached maximum capacity');
    assert(result.strategy === 'NONE', 'Auto-Assign: Returns NONE when no capacity available');
  } catch (err: any) {
    assert(false, 'Capacity check crashed', err.message);
  }

  return { passed, failed, errors };
}
