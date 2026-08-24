import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Clearing existing database tables...');
  await prisma.notificationLog.deleteMany();
  await prisma.orderStatusLog.deleteMany();
  await prisma.order.deleteMany();
  await prisma.rateCard.deleteMany();
  await prisma.pincodeMapping.deleteMany();
  await prisma.user.deleteMany();
  await prisma.zone.deleteMany();

  console.log('🗺️ Seeding Zones...');
  const zoneNorth = await prisma.zone.create({
    data: {
      code: 'ZONE_NORTH',
      name: 'North Logistics Cluster (Delhi North)',
      pincodes: '110001, 110007, 110009, 110033',
      adjacentZoneCodes: 'ZONE_CENTRAL, ZONE_WEST',
      centerLat: 28.7041,
      centerLng: 77.1025,
    },
  });

  const zoneSouth = await prisma.zone.create({
    data: {
      code: 'ZONE_SOUTH',
      name: 'South Logistics Cluster (Delhi South & Saket)',
      pincodes: '110016, 110017, 110019, 110024, 110048',
      adjacentZoneCodes: 'ZONE_CENTRAL, ZONE_EAST',
      centerLat: 28.5355,
      centerLng: 77.241,
    },
  });

  const zoneCentral = await prisma.zone.create({
    data: {
      code: 'ZONE_CENTRAL',
      name: 'Central Business Hub (CP & Daryaganj)',
      pincodes: '110002, 110003, 110004, 110005',
      adjacentZoneCodes: 'ZONE_NORTH, ZONE_SOUTH, ZONE_EAST, ZONE_WEST',
      centerLat: 28.6139,
      centerLng: 77.209,
    },
  });

  const zoneEast = await prisma.zone.create({
    data: {
      code: 'ZONE_EAST',
      name: 'East Trans-Yamuna Cluster',
      pincodes: '110091, 110092, 110093, 110095',
      adjacentZoneCodes: 'ZONE_CENTRAL, ZONE_SOUTH',
      centerLat: 28.628,
      centerLng: 77.2789,
    },
  });

  const zoneWest = await prisma.zone.create({
    data: {
      code: 'ZONE_WEST',
      name: 'West Industrial & Trade Corridor',
      pincodes: '110015, 110018, 110026, 110027',
      adjacentZoneCodes: 'ZONE_NORTH, ZONE_CENTRAL',
      centerLat: 28.6517,
      centerLng: 77.1232,
    },
  });

  console.log('📍 Seeding Pincode Mappings...');
  const pincodeData = [
    { pincode: '110001', areaName: 'Connaught Place', city: 'New Delhi', state: 'Delhi', zoneCode: 'ZONE_NORTH', lat: 28.6304, lng: 77.2177 },
    { pincode: '110007', areaName: 'Delhi University / Kamla Nagar', city: 'Delhi', state: 'Delhi', zoneCode: 'ZONE_NORTH', lat: 28.6946, lng: 77.209 },
    { pincode: '110009', areaName: 'Model Town / GTB Nagar', city: 'Delhi', state: 'Delhi', zoneCode: 'ZONE_NORTH', lat: 28.715, lng: 77.192 },
    { pincode: '110033', areaName: 'Adarsh Nagar / Jahangirpuri', city: 'Delhi', state: 'Delhi', zoneCode: 'ZONE_NORTH', lat: 28.72, lng: 77.17 },
    { pincode: '110016', areaName: 'Hauz Khas / Green Park', city: 'New Delhi', state: 'Delhi', zoneCode: 'ZONE_SOUTH', lat: 28.5535, lng: 77.2062 },
    { pincode: '110017', areaName: 'Malviya Nagar / Saket Hub', city: 'New Delhi', state: 'Delhi', zoneCode: 'ZONE_SOUTH', lat: 28.5284, lng: 77.2185 },
    { pincode: '110019', areaName: 'Kalkaji / Nehru Place', city: 'New Delhi', state: 'Delhi', zoneCode: 'ZONE_SOUTH', lat: 28.5492, lng: 77.2544 },
    { pincode: '110024', areaName: 'Lajpat Nagar / Defence Colony', city: 'New Delhi', state: 'Delhi', zoneCode: 'ZONE_SOUTH', lat: 28.57, lng: 77.24 },
    { pincode: '110048', areaName: 'Greater Kailash (GK-I/II)', city: 'New Delhi', state: 'Delhi', zoneCode: 'ZONE_SOUTH', lat: 28.536, lng: 77.238 },
    { pincode: '110002', areaName: 'Daryaganj / Delhi Gate', city: 'Delhi', state: 'Delhi', zoneCode: 'ZONE_CENTRAL', lat: 28.643, lng: 77.241 },
    { pincode: '110003', areaName: 'Aliganj / Lodhi Estate', city: 'New Delhi', state: 'Delhi', zoneCode: 'ZONE_CENTRAL', lat: 28.585, lng: 77.22 },
    { pincode: '110004', areaName: 'Rashtrapati Bhavan / Secretariat', city: 'New Delhi', state: 'Delhi', zoneCode: 'ZONE_CENTRAL', lat: 28.6143, lng: 77.1994 },
    { pincode: '110005', areaName: 'Karol Bagh Market', city: 'New Delhi', state: 'Delhi', zoneCode: 'ZONE_CENTRAL', lat: 28.652, lng: 77.19 },
    { pincode: '110091', areaName: 'Mayur Vihar Phase-1', city: 'East Delhi', state: 'Delhi', zoneCode: 'ZONE_EAST', lat: 28.608, lng: 77.295 },
    { pincode: '110092', areaName: 'Laxmi Nagar / Shakarpur', city: 'East Delhi', state: 'Delhi', zoneCode: 'ZONE_EAST', lat: 28.632, lng: 77.279 },
    { pincode: '110093', areaName: 'Shahdara / Vivek Vihar', city: 'East Delhi', state: 'Delhi', zoneCode: 'ZONE_EAST', lat: 28.675, lng: 77.302 },
    { pincode: '110015', areaName: 'Kirti Nagar Industrial Area', city: 'West Delhi', state: 'Delhi', zoneCode: 'ZONE_WEST', lat: 28.655, lng: 77.135 },
    { pincode: '110018', areaName: 'Tilak Nagar / Janakpuri', city: 'West Delhi', state: 'Delhi', zoneCode: 'ZONE_WEST', lat: 28.636, lng: 77.096 },
    { pincode: '110026', areaName: 'Punjabi Bagh West', city: 'West Delhi', state: 'Delhi', zoneCode: 'ZONE_WEST', lat: 28.668, lng: 77.13 },
    { pincode: '110027', areaName: 'Rajouri Garden / Subhash Nagar', city: 'West Delhi', state: 'Delhi', zoneCode: 'ZONE_WEST', lat: 28.648, lng: 77.122 },
  ];

  for (const p of pincodeData) {
    await prisma.pincodeMapping.create({ data: p });
  }

  console.log('💳 Seeding Rate Cards (B2B & B2C, Intra & Inter Zone)...');
  await prisma.rateCard.createMany({
    data: [
      {
        orderType: 'B2C',
        scope: 'INTRA_ZONE',
        baseWeightKg: 1.0,
        baseRate: 45.0,
        perKgRate: 18.0,
        codSurcharge: 25.0,
        minCodFee: 25.0,
        fuelSurchargePercent: 5.0,
        isActive: true,
      },
      {
        orderType: 'B2C',
        scope: 'INTER_ZONE',
        baseWeightKg: 1.0,
        baseRate: 75.0,
        perKgRate: 28.0,
        codSurcharge: 30.0,
        minCodFee: 30.0,
        fuelSurchargePercent: 7.5,
        isActive: true,
      },
      {
        orderType: 'B2B',
        scope: 'INTRA_ZONE',
        baseWeightKg: 5.0,
        baseRate: 120.0,
        perKgRate: 12.0,
        codSurcharge: 50.0,
        minCodFee: 50.0,
        fuelSurchargePercent: 4.0,
        isActive: true,
      },
      {
        orderType: 'B2B',
        scope: 'INTER_ZONE',
        baseWeightKg: 5.0,
        baseRate: 210.0,
        perKgRate: 16.0,
        codSurcharge: 65.0,
        minCodFee: 65.0,
        fuelSurchargePercent: 6.0,
        isActive: true,
      },
    ],
  });

  console.log('👥 Seeding Users (Admin, Agents, Customers)...');
  const admin = await prisma.user.create({
    data: {
      id: 'user_admin_01',
      name: 'Eleanor Vance',
      email: 'admin@logitrack.io',
      role: 'ADMIN',
      phone: '+91 98110 00001',
      status: 'AVAILABLE',
    },
  });

  const agentNorth = await prisma.user.create({
    data: {
      id: 'user_agent_01',
      name: 'Rahul Sharma',
      email: 'rahul.agent@logitrack.io',
      role: 'AGENT',
      phone: '+91 98110 00002',
      currentZoneId: zoneNorth.id,
      status: 'AVAILABLE',
      lat: 28.705,
      lng: 77.103,
      maxCapacity: 12,
      currentLoad: 2,
    },
  });

  const agentSouth = await prisma.user.create({
    data: {
      id: 'user_agent_02',
      name: 'David Chen',
      email: 'david.agent@logitrack.io',
      role: 'AGENT',
      phone: '+91 98110 00003',
      currentZoneId: zoneSouth.id,
      status: 'AVAILABLE',
      lat: 28.536,
      lng: 77.242,
      maxCapacity: 10,
      currentLoad: 1,
    },
  });

  const agentCentral = await prisma.user.create({
    data: {
      id: 'user_agent_03',
      name: 'Priya Patel',
      email: 'priya.agent@logitrack.io',
      role: 'AGENT',
      phone: '+91 98110 00004',
      currentZoneId: zoneCentral.id,
      status: 'AVAILABLE',
      lat: 28.614,
      lng: 77.21,
      maxCapacity: 15,
      currentLoad: 3,
    },
  });

  const agentEast = await prisma.user.create({
    data: {
      id: 'user_agent_04',
      name: 'Vikram Singh',
      email: 'vikram.agent@logitrack.io',
      role: 'AGENT',
      phone: '+91 98110 00005',
      currentZoneId: zoneEast.id,
      status: 'AVAILABLE',
      lat: 28.629,
      lng: 77.28,
      maxCapacity: 10,
      currentLoad: 0,
    },
  });

  const agentWest = await prisma.user.create({
    data: {
      id: 'user_agent_05',
      name: 'Ananya Verma',
      email: 'ananya.agent@logitrack.io',
      role: 'AGENT',
      phone: '+91 98110 00006',
      currentZoneId: zoneWest.id,
      status: 'AVAILABLE',
      lat: 28.652,
      lng: 77.124,
      maxCapacity: 8,
      currentLoad: 1,
    },
  });

  const customerB2B = await prisma.user.create({
    data: {
      id: 'user_customer_01',
      name: 'Acme Enterprise Solutions',
      email: 'acme.corp@example.com',
      role: 'CUSTOMER',
      phone: '+91 98110 99991',
    },
  });

  const customerB2C = await prisma.user.create({
    data: {
      id: 'user_customer_02',
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@example.com',
      role: 'CUSTOMER',
      phone: '+91 98110 99992',
    },
  });

  console.log('📦 Seeding Realistic Orders across Lifecycle...');

  // 1. Delivered Order (B2C Intra-zone)
  const order1 = await prisma.order.create({
    data: {
      trackingNumber: 'LOGI-984210',
      customerId: customerB2C.id,
      recipientName: 'Aarav Gupta',
      recipientPhone: '+91 99101 12345',
      pickupAddress: 'House 14, Kamla Nagar Market, Delhi',
      pickupPincode: '110007',
      pickupZoneId: zoneNorth.id,
      pickupLat: 28.6946,
      pickupLng: 77.209,
      dropAddress: 'Tower 4, Model Town Phase-2, Delhi',
      dropPincode: '110009',
      dropZoneId: zoneNorth.id,
      dropLat: 28.715,
      dropLng: 77.192,
      lengthCm: 25,
      breadthCm: 20,
      heightCm: 10,
      actualWeightKg: 1.2,
      volumetricWeightKg: 1.0, // (25*20*10)/5000 = 1.0
      chargeableWeightKg: 1.2,
      orderType: 'B2C',
      paymentType: 'PREPAID',
      zoneScope: 'INTRA_ZONE',
      baseRateApplied: 45.0,
      extraWeightCharge: 3.6, // 0.2 * 18
      codFeeApplied: 0.0,
      fuelSurchargeApplied: 2.43,
      totalAmount: 51.03,
      status: 'DELIVERED',
      assignedAgentId: agentNorth.id,
      createdAt: new Date(Date.now() - 3600 * 1000 * 24),
      updatedAt: new Date(Date.now() - 3600 * 1000 * 4),
    },
  });

  await prisma.orderStatusLog.createMany({
    data: [
      {
        orderId: order1.id,
        previousStatus: null,
        newStatus: 'PENDING_PICKUP',
        actorId: customerB2C.id,
        actorRole: 'CUSTOMER',
        notes: 'Order placed online via Customer Portal',
        timestamp: new Date(Date.now() - 3600 * 1000 * 24),
      },
      {
        orderId: order1.id,
        previousStatus: 'PENDING_PICKUP',
        newStatus: 'PICKED_UP',
        actorId: agentNorth.id,
        actorRole: 'AGENT',
        notes: 'Package picked up from merchant in Kamla Nagar',
        timestamp: new Date(Date.now() - 3600 * 1000 * 18),
      },
      {
        orderId: order1.id,
        previousStatus: 'PICKED_UP',
        newStatus: 'IN_TRANSIT',
        actorId: agentNorth.id,
        actorRole: 'AGENT',
        notes: 'En route through North Logistics Hub',
        timestamp: new Date(Date.now() - 3600 * 1000 * 12),
      },
      {
        orderId: order1.id,
        previousStatus: 'IN_TRANSIT',
        newStatus: 'OUT_FOR_DELIVERY',
        actorId: agentNorth.id,
        actorRole: 'AGENT',
        notes: 'Out with delivery partner Rahul Sharma',
        timestamp: new Date(Date.now() - 3600 * 1000 * 6),
      },
      {
        orderId: order1.id,
        previousStatus: 'OUT_FOR_DELIVERY',
        newStatus: 'DELIVERED',
        actorId: agentNorth.id,
        actorRole: 'AGENT',
        notes: 'Package handed over to Aarav Gupta (Signed by recipient)',
        timestamp: new Date(Date.now() - 3600 * 1000 * 4),
      },
    ],
  });

  // 2. Out for Delivery (B2B Inter-zone with volumetric weight dominance)
  const order2 = await prisma.order.create({
    data: {
      trackingNumber: 'LOGI-773194',
      customerId: customerB2B.id,
      recipientName: 'Karan Mehra (Procurement Lead)',
      recipientPhone: '+91 98711 54321',
      pickupAddress: 'Plot 48, Kirti Nagar Industrial Area, New Delhi',
      pickupPincode: '110015',
      pickupZoneId: zoneWest.id,
      pickupLat: 28.655,
      pickupLng: 77.135,
      dropAddress: 'Saket District Centre, Sector 6, New Delhi',
      dropPincode: '110017',
      dropZoneId: zoneSouth.id,
      dropLat: 28.5284,
      dropLng: 77.2185,
      lengthCm: 60,
      breadthCm: 50,
      heightCm: 40,
      actualWeightKg: 8.0,
      volumetricWeightKg: 24.0, // (60*50*40)/5000 = 24.0 kg!
      chargeableWeightKg: 24.0,
      orderType: 'B2B',
      paymentType: 'COD',
      zoneScope: 'INTER_ZONE',
      baseRateApplied: 210.0,
      extraWeightCharge: 304.0, // (24 - 5) * 16 = 304
      codFeeApplied: 65.0,
      fuelSurchargeApplied: 34.74,
      totalAmount: 613.74,
      status: 'OUT_FOR_DELIVERY',
      assignedAgentId: agentSouth.id,
      createdAt: new Date(Date.now() - 3600 * 1000 * 10),
      updatedAt: new Date(Date.now() - 3600 * 1000 * 1),
    },
  });

  await prisma.orderStatusLog.createMany({
    data: [
      {
        orderId: order2.id,
        previousStatus: null,
        newStatus: 'PENDING_PICKUP',
        actorId: customerB2B.id,
        actorRole: 'CUSTOMER',
        notes: 'Bulk B2B crate dispatch generated',
        timestamp: new Date(Date.now() - 3600 * 1000 * 10),
      },
      {
        orderId: order2.id,
        previousStatus: 'PENDING_PICKUP',
        newStatus: 'PICKED_UP',
        actorId: agentWest.id,
        actorRole: 'AGENT',
        notes: 'Pallet verified and loaded at Kirti Nagar Warehouse',
        timestamp: new Date(Date.now() - 3600 * 1000 * 7),
      },
      {
        orderId: order2.id,
        previousStatus: 'PICKED_UP',
        newStatus: 'IN_TRANSIT',
        actorId: admin.id,
        actorRole: 'ADMIN',
        notes: 'Transferred across West to South inter-zone link',
        timestamp: new Date(Date.now() - 3600 * 1000 * 4),
      },
      {
        orderId: order2.id,
        previousStatus: 'IN_TRANSIT',
        newStatus: 'OUT_FOR_DELIVERY',
        actorId: agentSouth.id,
        actorRole: 'AGENT',
        notes: 'Agent David Chen is arriving at Saket District Centre',
        timestamp: new Date(Date.now() - 3600 * 1000 * 1),
      },
    ],
  });

  // 3. In Transit (B2C Inter-zone)
  const order3 = await prisma.order.create({
    data: {
      trackingNumber: 'LOGI-552081',
      customerId: customerB2C.id,
      recipientName: 'Neha Sen',
      recipientPhone: '+91 97110 88776',
      pickupAddress: 'Shop 12, Connaught Place, Block B, New Delhi',
      pickupPincode: '110001',
      pickupZoneId: zoneNorth.id,
      pickupLat: 28.6304,
      pickupLng: 77.2177,
      dropAddress: 'Flat 302, Pocket 1, Mayur Vihar Phase-1',
      dropPincode: '110091',
      dropZoneId: zoneEast.id,
      dropLat: 28.608,
      dropLng: 77.295,
      lengthCm: 30,
      breadthCm: 20,
      heightCm: 15,
      actualWeightKg: 2.5,
      volumetricWeightKg: 1.8,
      chargeableWeightKg: 2.5,
      orderType: 'B2C',
      paymentType: 'PREPAID',
      zoneScope: 'INTER_ZONE',
      baseRateApplied: 75.0,
      extraWeightCharge: 42.0,
      codFeeApplied: 0.0,
      fuelSurchargeApplied: 8.78,
      totalAmount: 125.78,
      status: 'IN_TRANSIT',
      assignedAgentId: agentCentral.id,
      createdAt: new Date(Date.now() - 3600 * 1000 * 5),
      updatedAt: new Date(Date.now() - 3600 * 1000 * 3),
    },
  });

  await prisma.orderStatusLog.createMany({
    data: [
      {
        orderId: order3.id,
        previousStatus: null,
        newStatus: 'PENDING_PICKUP',
        actorId: admin.id,
        actorRole: 'ADMIN',
        notes: 'Admin created shipment on behalf of customer',
        timestamp: new Date(Date.now() - 3600 * 1000 * 5),
      },
      {
        orderId: order3.id,
        previousStatus: 'PENDING_PICKUP',
        newStatus: 'PICKED_UP',
        actorId: agentCentral.id,
        actorRole: 'AGENT',
        notes: 'Collected from CP store',
        timestamp: new Date(Date.now() - 3600 * 1000 * 4),
      },
      {
        orderId: order3.id,
        previousStatus: 'PICKED_UP',
        newStatus: 'IN_TRANSIT',
        actorId: agentCentral.id,
        actorRole: 'AGENT',
        notes: 'Cross-river transit towards East hub',
        timestamp: new Date(Date.now() - 3600 * 1000 * 3),
      },
    ],
  });

  // 4. Failed Delivery (Ready for 1-click Reschedule flow testing!)
  const order4 = await prisma.order.create({
    data: {
      trackingNumber: 'LOGI-119483',
      customerId: customerB2C.id,
      recipientName: 'Rohan Kapoor',
      recipientPhone: '+91 99550 44332',
      pickupAddress: 'C-24, Hauz Khas Enclave, New Delhi',
      pickupPincode: '110016',
      pickupZoneId: zoneSouth.id,
      pickupLat: 28.5535,
      pickupLng: 77.2062,
      dropAddress: 'Villa 18, Greater Kailash-II (GK-2), New Delhi',
      dropPincode: '110048',
      dropZoneId: zoneSouth.id,
      dropLat: 28.536,
      dropLng: 77.238,
      lengthCm: 20,
      breadthCm: 15,
      heightCm: 10,
      actualWeightKg: 0.8,
      volumetricWeightKg: 0.6,
      chargeableWeightKg: 0.8,
      orderType: 'B2C',
      paymentType: 'COD',
      zoneScope: 'INTRA_ZONE',
      baseRateApplied: 45.0,
      extraWeightCharge: 0.0,
      codFeeApplied: 25.0,
      fuelSurchargeApplied: 3.5,
      totalAmount: 73.5,
      status: 'FAILED',
      failureReason: 'Customer unavailable & gate locked during delivery attempt',
      rescheduleToken: 'reschedule_token_demo_119483',
      assignedAgentId: agentSouth.id,
      createdAt: new Date(Date.now() - 3600 * 1000 * 14),
      updatedAt: new Date(Date.now() - 3600 * 1000 * 2),
    },
  });

  await prisma.orderStatusLog.createMany({
    data: [
      {
        orderId: order4.id,
        previousStatus: null,
        newStatus: 'PENDING_PICKUP',
        actorId: customerB2C.id,
        actorRole: 'CUSTOMER',
        notes: 'Order initiated for priority residential delivery',
        timestamp: new Date(Date.now() - 3600 * 1000 * 14),
      },
      {
        orderId: order4.id,
        previousStatus: 'PENDING_PICKUP',
        newStatus: 'PICKED_UP',
        actorId: agentSouth.id,
        actorRole: 'AGENT',
        notes: 'Picked up from Hauz Khas seller',
        timestamp: new Date(Date.now() - 3600 * 1000 * 10),
      },
      {
        orderId: order4.id,
        previousStatus: 'PICKED_UP',
        newStatus: 'OUT_FOR_DELIVERY',
        actorId: agentSouth.id,
        actorRole: 'AGENT',
        notes: 'Agent reached GK-2 delivery vicinity',
        timestamp: new Date(Date.now() - 3600 * 1000 * 4),
      },
      {
        orderId: order4.id,
        previousStatus: 'OUT_FOR_DELIVERY',
        newStatus: 'FAILED',
        actorId: agentSouth.id,
        actorRole: 'AGENT',
        notes: 'Delivery failed: Customer phone unanswered and gate locked. Automated SMS & Email notification sent with 1-click reschedule link.',
        timestamp: new Date(Date.now() - 3600 * 1000 * 2),
      },
    ],
  });

  // Notification logs for failed order
  await prisma.notificationLog.createMany({
    data: [
      {
        orderId: order4.id,
        channel: 'EMAIL',
        recipient: customerB2C.email,
        title: '⚠️ Delivery Attempt Notice: Action Required for LOGI-119483',
        message: 'Delivery failed: Customer phone unanswered. Click here to pick a new date: /reschedule/reschedule_token_demo_119483',
        status: 'SENT',
        sentAt: new Date(Date.now() - 3600 * 1000 * 2),
      },
      {
        orderId: order4.id,
        channel: 'SMS',
        recipient: '+91 99550 44332',
        title: 'Delivery Failed SMS',
        message: 'LogiTrack: Delivery attempt failed for LOGI-119483. Pick a new delivery slot: /reschedule/reschedule_token_demo_119483',
        status: 'SENT',
        sentAt: new Date(Date.now() - 3600 * 1000 * 2),
      },
    ],
  });

  // 5. Newly Created Pending Pickup
  const order5 = await prisma.order.create({
    data: {
      trackingNumber: 'LOGI-331902',
      customerId: customerB2B.id,
      recipientName: 'Pooja Aggarwal',
      recipientPhone: '+91 98118 77665',
      pickupAddress: 'Unit 9, Karol Bagh Market, Central Delhi',
      pickupPincode: '110005',
      pickupZoneId: zoneCentral.id,
      pickupLat: 28.652,
      pickupLng: 77.19,
      dropAddress: 'Building 12, Punjabi Bagh West',
      dropPincode: '110026',
      dropZoneId: zoneWest.id,
      dropLat: 28.668,
      dropLng: 77.13,
      lengthCm: 35,
      breadthCm: 25,
      heightCm: 15,
      actualWeightKg: 4.2,
      volumetricWeightKg: 2.63,
      chargeableWeightKg: 4.2,
      orderType: 'B2B',
      paymentType: 'PREPAID',
      zoneScope: 'INTER_ZONE',
      baseRateApplied: 210.0,
      extraWeightCharge: 0.0,
      codFeeApplied: 0.0,
      fuelSurchargeApplied: 12.6,
      totalAmount: 222.6,
      status: 'PENDING_PICKUP',
      assignedAgentId: agentCentral.id,
      createdAt: new Date(Date.now() - 3600 * 1000 * 1),
      updatedAt: new Date(Date.now() - 3600 * 1000 * 1),
    },
  });

  await prisma.orderStatusLog.create({
    data: {
      orderId: order5.id,
      previousStatus: null,
      newStatus: 'PENDING_PICKUP',
      actorId: customerB2B.id,
      actorRole: 'CUSTOMER',
      notes: 'B2B order confirmed. Auto-assigned to Priya Patel (Zone Central Hub)',
      timestamp: new Date(Date.now() - 3600 * 1000 * 1),
    },
  });

  console.log('✅ Database seeded successfully with 5 zones, 20 pincodes, 4 rate cards, 7 users, and 5 demo shipments!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
