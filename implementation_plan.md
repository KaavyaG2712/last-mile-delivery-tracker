# Implementation Plan: LogiTrack Engine - Last-Mile Delivery Tracker

The goal is to build the complete, production-ready full-stack application for the "LogiTrack Engine" Last-Mile Delivery Tracker.

## User Review Required

> [!NOTE]
> Database Engine: Using SQLite via Prisma (`prisma/schema.prisma`) for zero-friction local execution, seeding, and automated testing out of the box, with full compatibility and documented migration steps for PostgreSQL (Supabase / Neon / Railway).
> 
> Auth: Lightweight NextAuth-compatible JWT session / Role-Based Authentication supporting `CUSTOMER`, `AGENT`, and `ADMIN` with a persistent sticky quick-switcher in the UI.

---

## Senior Engineering Features Added

1. **Concurrency & Race Condition Handling**:
   - In `lib/assignmentEngine.ts` and order allocation endpoints, we use Prisma interactive transactions (`prisma.$transaction(async (tx) => { ... })`).
   - Atomically increments/checks agent capacity and acquires order assignment lock, preventing two concurrent orders from claiming the same agent capacity at the exact same millisecond.
2. **Haversine Distance Algorithm (Zero External Geo Dependencies)**:
   - Pure TypeScript implementation of the spherical trigonometric Haversine formula calculating distance in kilometers between pickup coordinates `(lat1, lon1)` and agent coordinates `(lat2, lon2)`:
     $$d = 2r \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
   - Used for primary intra-zone distance ranking and fallback adjacent-zone proximity ranking.
3. **Visual SLA Flags**:
   - Dynamic SLA monitoring in Admin & Agent dashboards:
     - `PENDING_PICKUP`: Warning (Yellow) > 30m, Breached (Red) > 60m
     - `IN_TRANSIT`: Warning (Yellow) > 120m, Breached (Red) > 240m
     - `OUT_FOR_DELIVERY`: Warning (Yellow) > 90m, Breached (Red) > 180m
     - `FAILED` / `RESCHEDULED`: Highlighted action state
4. **Demo Quick-Switcher**:
   - Persistent, sticky UI floating toolbar mounted globally allowing 1-click swapping between:
     - **Admin**: "Operations Director (Admin)"
     - **Agent**: "Rahul Sharma (Zone North Agent)" / "David Chen (Zone South Agent)"
     - **Customer**: "Acme Logistics Corp (B2B Customer)" / "Sarah Jenkins (B2C Customer)"
   - Prominently highlighted at the very top of `README.md`.

---

## Proposed System Architecture

### 1. Database Layer (`prisma/schema.prisma`)
- **`User`**: `id`, `email`, `passwordHash`, `name`, `role` (`ADMIN`, `AGENT`, `CUSTOMER`), `phone`, `currentZoneId`, `status` (`AVAILABLE`, `BUSY`, `OFFLINE`), `lat`, `lng`, `maxCapacity`, `currentLoad`.
- **`Zone`**: `id`, `code` (e.g. `ZONE_NORTH`, `ZONE_SOUTH`), `name`, `pincodes` (JSON array / comma list), `adjacentZoneIds` (JSON array), `centerLat`, `centerLng`.
- **`PincodeZoneMapping`**: `pincode`, `areaName`, `zoneId`.
- **`RateCard`**: `id`, `orderType` (`B2B`, `B2C`), `scope` (`INTRA_ZONE`, `INTER_ZONE`), `baseWeightKg`, `baseRate`, `perKgRate`, `codSurcharge`, `minCodFee`, `fuelSurchargePercent`, `updatedAt`.
- **`Order`**: `id`, `trackingNumber`, `customerId`, `pickupAddress`, `pickupPincode`, `pickupZoneId`, `dropAddress`, `dropPincode`, `dropZoneId`, `lengthCm`, `breadthCm`, `heightCm`, `actualWeightKg`, `volumetricWeightKg`, `chargeableWeightKg`, `orderType` (`B2B`, `B2C`), `paymentType` (`PREPAID`, `COD`), `baseRateApplied`, `extraWeightCharge`, `codFeeApplied`, `totalAmount`, `status` (`PENDING_PICKUP`, `PICKED_UP`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `FAILED`, `RESCHEDULED`), `assignedAgentId`, `rescheduleDate`, `rescheduleTimeSlot`, `failureReason`, `rescheduleToken`, `createdAt`, `updatedAt`.
- **`OrderStatusLog`**: `id`, `orderId`, `previousStatus`, `newStatus`, `actorId`, `actorRole`, `notes`, `locationLat`, `locationLng`, `timestamp`.
- **`NotificationLog`**: `id`, `orderId`, `channel` (`EMAIL`, `SMS`), `recipient`, `title`, `message`, `status`, `sentAt`.

---

### 2. Core Business Engine Modules (`lib/`)
- **`lib/rateEngine.ts`**:
  - `calculateVolumetricWeight(l, b, h)`: `(l * b * h) / 5000`
  - `calculateChargeableWeight(actualWeight, volumetricWeight)`: `Math.max(actual, volumetric)`
  - `detectZone(pincode, zoneMappings)`: resolves pincode to zone
  - `calculateOrderQuote(params, rateCard)`: calculates base charge, additional weight surcharge, COD fee, tax/total with clear breakdown.
- **`lib/geo.ts`**:
  - Pure Haversine distance calculator between coordinates.
- **`lib/assignmentEngine.ts`**:
  - Nearest available agent selection based on `pickupZoneId` and Haversine distance.
  - Fallback to adjacent zones with lowest active payload (`currentLoad`).
  - Transaction-safe assignment using Prisma interactive transactions.
- **`lib/sla.ts`**:
  - SLA time-in-state calculation and status badge color thresholds.
- **`lib/notificationService.ts`**:
  - Automated customer Email and SMS notification triggers on status transitions.
- **`lib/prisma.ts`**: Singleton Prisma client.
- **`lib/auth.ts`**: Role-based session management and JWT authentication utilities.

---

### 3. API Routes (`src/app/api/`)
- `POST /api/rate/calculate`: Dynamic quotation endpoint before placing order.
- `POST /api/orders`: Create new order (Customer or Admin on behalf of Customer) + automatic agent auto-assignment.
- `GET /api/orders`: Filterable list of orders (by status, zone, agent, customer).
- `GET /api/orders/[id]`: Order detail with full immutable tracking history timeline.
- `PATCH /api/orders/[id]/status`: Update order status with actor logging (Agent or Admin override).
- `POST /api/orders/[id]/assign`: Auto-assign or manually assign delivery agent with interactive transaction lock.
- `POST /api/orders/reschedule`: 1-click tokenized or authenticated reschedule endpoint.
- `GET /api/zones` & `POST /api/zones`: Zone management.
- `GET /api/rate-cards` & `PUT /api/rate-cards`: Rate card configuration.
- `GET /api/agents`: Delivery agent status and current active payload.
- `POST /api/auth/demo-switch` & `/api/auth/me`: Fast demo role switcher endpoints.

---

### 4. Interactive User Interface & Dashboards (`src/app/`)
- **Global Layout & Navigation**: Premium logistics theme (modern dark/light slate palette, glassmorphism, responsive sidebar & topbar, persistent Demo Quick-Switcher).
- **Customer Portal (`/dashboard` & `/orders/new`)**:
  - Dynamic Order Creation form with real-time rate calculator side-panel.
  - My Shipments dashboard with active status filters.
  - Interactive Live Tracking timeline page (`/track/[id]`) with map visualizer, step progression, delivery agent card, and immutable timeline log.
- **Delivery Agent Mobile View (`/agent`)**:
  - Mobile-first delivery task queue with one-tap status updates (Pick up, In Transit, Out for Delivery, Delivered, Mark as Failed with modal).
- **Admin Control Center (`/admin`)**:
  - Orders Grid with rich multi-filter (Status, Zone, Agent, SLA breach status), live reassignment selector, status override dialog, and audit history drawer.
  - Rate Card Manager: Dynamic configuration of B2B/B2C, Intra/Inter zone rates, COD surcharges, base weights.
  - Zone & Pincode Matrix: Visual zone manager with pincode mappings and adjacent zone graph.
  - System Analytics: Live KPIs (Total deliveries, SLA delivery success rate, average chargeable weight, revenue, agent utilization).
- **Public 1-Click Reschedule Portal (`/reschedule/[token]`)**:
  - Fast, responsive reschedule calendar & time slot picker for failed deliveries.

---

### 5. Automated Tests & Seed Script
- `lib/__tests__/rateEngine.test.ts`: Pure unit tests verifying all volumetric weight, B2B/B2C, intra vs inter zone, base vs extra weight, and COD scenarios.
- `lib/__tests__/assignmentEngine.test.ts`: Tests for Haversine distance, zone fallback, and load balancing.
- `prisma/seed.ts`: Rich seed data with 5 zones, 20+ pincodes, 4 rate cards (B2B/B2C x Intra/Inter), 5 delivery agents, demo customer & admin accounts, and sample orders across all lifecycle states.

---

### 6. System Design Document & Documentation
- `SYSTEM_DESIGN.md`: Comprehensive architectural document (~800 words) covering Rate Calculation Engine, Zone Detection, Smart Auto-Assignment Algorithm, Failed Delivery Reschedule Flow, Concurrency Controls, Data Consistency, and Scalability.
- `README.md`: Setup guide, environment configuration, DB schema, API reference, rate calculation formulas, and deployment instructions.
- `.env.example`: Complete environment variable reference.

---

## Verification Plan

### Automated Tests
- Run Rate Engine and Assignment Engine Unit Tests: `npx tsx lib/__tests__/rateEngine.test.ts` & `npx tsx lib/__tests__/assignmentEngine.test.ts`.
- Run Prisma migrations & seed: `npx prisma db push && npx tsx prisma/seed.ts`.
- Run TypeScript compile check: `npx tsc --noEmit` or `npm run build`.

### Manual & Subagent Verification
- Verify customer order placement with real-time rate calculator.
- Verify nearest agent auto-assignment with Haversine distance.
- Verify status progression and immutable audit logging in `OrderStatusLog`.
- Verify delivery failure notification trigger and 1-click customer rescheduling flow.
- Verify Admin rate card and zone updates dynamically affecting quotes.
