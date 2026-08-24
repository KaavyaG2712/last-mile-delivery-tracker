# 🚚 LogiTrack Engine — Last-Mile Delivery Tracker

> **A Production-Grade Last-Mile Delivery Management Platform with Dynamic Pricing, Pure Haversine Auto-Assignment, Concurrency-Safe State Machines, and 1-Click Failed Delivery Recovery.**

---

## ⚡ DEMO QUICK-SWITCHER (EVALUATOR TOOL)

LogiTrack includes a **persistent sticky session bar** mounted at the very top of every screen. Evaluators can instantly switch roles with a single click without logging in or typing passwords:

| Persona | Role | Default Account | Key Capabilities to Test |
| :--- | :--- | :--- | :--- |
| **Operations Director** | `ADMIN` | `admin@logitrack.io` | Full operations control, live order grid, rate card manager, zone matrix, manual overrides |
| **Rahul Sharma** | `AGENT` | `rahul.agent@logitrack.io` | Zone North delivery partner, mobile one-tap status updates (Pick up, Transit, Out for Delivery, Mark Failed) |
| **David Chen** | `AGENT` | `david.agent@logitrack.io` | Zone South delivery partner, mobile dispatch actions |
| **Acme Enterprise** | `CUSTOMER (B2B)` | `acme.corp@example.com` | High-volume commercial freight ordering, B2B rate cards, live volumetric pricing |
| **Sarah Jenkins** | `CUSTOMER (B2C)` | `sarah.jenkins@example.com` | Retail ecommerce parcels, COD surcharge testing, 1-click reschedule flow |

---

## 🚀 Quick Start & Local Setup

### 1. Prerequisites
- **Node.js**: v18.0+ or v20.0+ (Tested on v22.13.1)
- **npm**: v9.0+

### 2. Installation & Database Setup
Clone or navigate to the repository directory, then run:

```bash
# 1. Install dependencies
npm install

# 2. Setup SQLite database and generate Prisma Client
npx prisma db push

# 3. Seed realistic data (5 zones, 20 pincodes, 4 rate cards, 7 users, 5 demo orders)
node node_modules/tsx/dist/cli.mjs prisma/seed.ts

# 4. Run automated test suite (30/30 unit tests)
npm test

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Automated Test Suite

LogiTrack comes with comprehensive unit tests for the pure Rate Engine, Haversine Distance algorithm, and Smart Auto-Assignment heuristics:

```bash
npm test
```

### Test Coverage Highlights:
- ✅ **Volumetric Weight Calculation**: `(L * B * H) / 5000` with boundary checks.
- ✅ **Chargeable Weight Rule**: `MAX(Actual Weight, Volumetric Weight)`.
- ✅ **Dynamic Rate Cards**: Zero hardcoded rates for B2B vs B2C, Intra-Zone vs Inter-Zone.
- ✅ **COD & Fuel Surcharges**: Surcharge calculations per order type.
- ✅ **Pure Haversine Calculations**: Accurate spherical great-circle distances without external GIS libraries.
- ✅ **Auto-Assignment & Fallbacks**: Primary zone proximity, adjacent zone fallback, capacity limit enforcement.

---

## 📐 Rate Calculation Engine & Formulas

### 1. Volumetric (Dimensional) Weight
$$\text{Volumetric Weight (kg)} = \frac{\text{Length (cm)} \times \text{Breadth (cm)} \times \text{Height (cm)}}{5000}$$

### 2. Chargeable (Billable) Weight
$$\text{Chargeable Weight (kg)} = \max(\text{Actual Scale Weight}, \text{Volumetric Weight})$$

### 3. Dynamic Pricing Model (Zero Hardcoding)
Rates are queried dynamically from the `RateCard` table matching `(orderType, zoneScope)`:
$$\text{Extra Weight (kg)} = \max(0, \text{Chargeable Weight} - \text{Base Weight})$$
$$\text{Freight Subtotal} = \text{Base Rate} + (\text{Extra Weight} \times \text{Per-Kg Rate})$$
$$\text{COD Fee} = \begin{cases} \max(\text{COD Surcharge}, \text{Min COD Fee}) & \text{if PaymentType} = \text{COD} \\ 0 & \text{if PaymentType} = \text{PREPAID} \end{cases}$$
$$\text{Total Price} = \text{Freight Subtotal} + \text{COD Fee} + \left((\text{Freight Subtotal} + \text{COD Fee}) \times \frac{\text{Fuel Surcharge \%}}{100}\right)$$

---

## 🗺️ Smart Auto-Assignment Algorithm

1. **Zone Resolution**: Maps pickup pincode to `pickupZoneId`.
2. **Primary Match (Intra-Zone)**: Filters available delivery agents in the pickup zone (`status = AVAILABLE` and `currentLoad < maxCapacity`).
3. **Haversine Distance & Load Balancing**: Agents are ranked using the pure TypeScript Haversine spherical formula and active load penalty:
   $$\text{Score} = (\text{Distance}_{\text{km}} \times 0.6) + (\text{CurrentLoad} \times 1.5)$$
4. **Adjacent Zone Fallback**: If no agent is available in the primary zone, the engine searches adjacent zones from `pickupZone.adjacentZoneCodes`.
5. **Concurrency Locks**: Uses **Prisma interactive database transactions** to lock the agent record, check capacity, increment `currentLoad`, bind the order, and append to `OrderStatusLog` in one atomic commit.

---

## 🗄️ Database Schema Breakdown

### Key Entities (`prisma/schema.prisma`):
- **`User`**: Role-based authentication (`ADMIN`, `AGENT`, `CUSTOMER`), current zone assignment, live status (`AVAILABLE`, `BUSY`), GPS coordinates, `maxCapacity`, `currentLoad`.
- **`Zone`**: Geographic logistics hubs with center coordinates, comma-separated covered pincodes, and adjacent zone codes.
- **`PincodeMapping`**: Resolves 6-digit pincodes to area names, cities, zone codes, and exact latitude/longitude.
- **`RateCard`**: Configurable pricing matrix for `(B2B/B2C) × (INTRA_ZONE/INTER_ZONE)` with base weight, base rate, per-kg extra rate, COD surcharge, and fuel surcharge %.
- **`Order`**: Complete shipment record storing tracking number, dimensions, weights, rates applied, status, assigned agent, failure reason, and reschedule token.
- **`OrderStatusLog`**: **Immutable append-only audit trail** recording `orderId`, `previousStatus`, `newStatus`, `actorId`, `actorRole`, `notes`, coordinates, and timestamp.
- **`NotificationLog`**: Dispatched Email & SMS notifications.

---

## 📡 REST API Reference

### 1. Dynamic Rate Engine
- `POST /api/rate/calculate`: Returns detailed quotation and weight breakdown.
  - **Body**: `{ lengthCm, breadthCm, heightCm, actualWeightKg, orderType, paymentType, pickupPincode, dropPincode }`

### 2. Orders Management
- `GET /api/orders`: List orders with multi-filters (`status`, `zoneId`, `agentId`, `search`) and dynamic SLA evaluations.
- `POST /api/orders`: Dual creation endpoint (Customer booking or Admin booking on behalf of customer) + smart auto-assignment.
- `GET /api/orders/[id]`: Returns order tracking details, SLA evaluation, immutable status logs, and dispatched notifications.
- `PATCH /api/orders/[id]/status`: Lifecycle status transition with immutable logging, agent load tracking, and automated failure notifications.
- `POST /api/orders/[id]/assign`: Manually assign or trigger auto-assignment with database transaction locks.
- `POST /api/orders/reschedule`: 1-click tokenized customer rescheduling with automated agent re-assignment.

### 3. Administration & Infrastructure
- `GET /api/zones` & `POST /api/zones`: View & create logistics zones.
- `GET /api/rate-cards` & `PUT /api/rate-cards`: Live dynamic rate card configuration.
- `GET /api/agents`: Delivery agent live capacity & payload tracker.
- `POST /api/auth/demo-switch` & `GET /api/auth/me`: Fast demo persona switcher.

---

## 📋 Environment Configuration (`.env.example`)

```env
# Database connection (SQLite for zero-friction local setup, PostgreSQL for production)
DATABASE_URL="file:./dev.db"

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
PORT=3000
```

---

## 🔄 Failed Delivery & 1-Click Reschedule Workflow

```
[Agent marks attempt as FAILED] 
            │
            ▼
[OrderStatusLog records failure reason & coordinates]
            │
            ▼
[Automated SMS & Email dispatched with secure 1-click reschedule link]
            │
            ▼
[Customer clicks link -> Selects preferred date, slot, and delivery notes]
            │
            ▼
[System updates status to RESCHEDULED -> Re-runs Auto-Assignment Engine]
            │
            ▼
[Nearest available agent allocated for rescheduled attempt]
```

---

## 🏛️ System Design Write-Up
A comprehensive ~800-word architectural system design document is available in [`SYSTEM_DESIGN.md`](./SYSTEM_DESIGN.md).
