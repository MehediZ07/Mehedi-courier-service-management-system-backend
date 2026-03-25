import { PrismaClient, Role, UserStatus, VehicleType, ApprovalStatus, ShipmentStatus, Priority, PaymentStatus, PaymentMethod, RegionType, HubType, DeliveryType, LegType, LocationType, LegStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...\n');

  // Clean existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.notification.deleteMany();
  await prisma.shipmentEvent.deleteMany();
  await prisma.shipmentLeg.deleteMany();
  await prisma.shipmentPricing.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.merchant.deleteMany();
  await prisma.courier.deleteMany();
  await prisma.user.deleteMany();
  await prisma.hub.deleteMany();
  await prisma.pricing.deleteMany();
  console.log('✅ Cleanup completed\n');

  // ============================================
  // 1. PRICING (No FK dependencies)
  // ============================================
  console.log('📊 Seeding Pricing...');
  const pricingData = [
    { regionType: RegionType.LOCAL, basePrice: 50, perKgPrice: 20, expressMult: 1.2 },
    { regionType: RegionType.NATIONAL, basePrice: 100, perKgPrice: 30, expressMult: 1.25 },
    { regionType: RegionType.INTERNATIONAL, basePrice: 500, perKgPrice: 150, expressMult: 1.5 },
  ];

  for (const pricing of pricingData) {
    await prisma.pricing.upsert({
      where: { regionType: pricing.regionType },
      update: pricing,
      create: pricing,
    });
  }
  console.log('✅ Pricing seeded\n');

  // ============================================
  // 2. HUBS (No FK dependencies)
  // ============================================
  console.log('🏢 Seeding Hubs...');
  const hubsData = [
    { id: 'hub-dhaka-central', name: 'Dhaka Central Hub', city: 'Dhaka', address: 'Gulshan-1, Dhaka 1212', hubType: HubType.LOCAL },
    { id: 'hub-chittagong', name: 'Chittagong Hub', city: 'Chittagong', address: 'Agrabad, Chittagong 4100', hubType: HubType.LOCAL },
    { id: 'hub-sylhet', name: 'Sylhet Hub', city: 'Sylhet', address: 'Zindabazar, Sylhet 3100', hubType: HubType.LOCAL },
    { id: 'hub-rajshahi', name: 'Rajshahi Hub', city: 'Rajshahi', address: 'Shaheb Bazar, Rajshahi 6100', hubType: HubType.LOCAL },
    { id: 'hub-khulna', name: 'Khulna Hub', city: 'Khulna', address: 'Sonadanga, Khulna 9100', hubType: HubType.LOCAL },
    { id: 'hub-barisal', name: 'Barisal Hub', city: 'Barisal', address: 'Sadar Road, Barisal 8200', hubType: HubType.LOCAL },
    { id: 'hub-rangpur', name: 'Rangpur Hub', city: 'Rangpur', address: 'Station Road, Rangpur 5400', hubType: HubType.LOCAL },
    { id: 'hub-mymensingh', name: 'Mymensingh Hub', city: 'Mymensingh', address: 'Charpara, Mymensingh 2200', hubType: HubType.LOCAL },
    { id: 'hub-comilla', name: 'Comilla Hub', city: 'Comilla', address: 'Kandirpar, Comilla 3500', hubType: HubType.LOCAL },
    { id: 'hub-gazipur', name: 'Gazipur Hub', city: 'Gazipur', address: 'Joydebpur, Gazipur 1700', hubType: HubType.LOCAL },
    { id: 'hub-dhaka-regional', name: 'Dhaka Regional Hub', city: 'Dhaka', address: 'Uttara, Dhaka 1230', hubType: HubType.REGIONAL },
    { id: 'hub-chittagong-regional', name: 'Chittagong Regional Hub', city: 'Chittagong', address: 'Patenga, Chittagong 4200', hubType: HubType.REGIONAL },
    { id: 'hub-dhaka-intl', name: 'Dhaka International Hub', city: 'Dhaka', address: 'Hazrat Shahjalal International Airport, Dhaka 1229', hubType: HubType.INTERNATIONAL },
  ];

  for (const hub of hubsData) {
    await prisma.hub.create({ data: hub });
  }
  console.log('✅ Hubs seeded\n');

  // ============================================
  // 3. USERS (No FK dependencies)
  // ============================================
  console.log('👥 Seeding Users...');
  const hashedPassword = await bcrypt.hash('Password@123', 10);

  const users = [
    { id: 'admin-001', name: 'Admin User', email: 'admin@courier.com', password: hashedPassword, phone: '+8801711111111', role: Role.ADMIN, status: UserStatus.ACTIVE },
    { id: 'admin-002', name: 'Super Admin', email: 'superadmin@courier.com', password: hashedPassword, phone: '+8801712222222', role: Role.SUPER_ADMIN, status: UserStatus.ACTIVE },
    { id: 'courier-001', name: 'Rahim Khan', email: 'rahim.courier@example.com', password: hashedPassword, phone: '+8801722222222', role: Role.COURIER, status: UserStatus.ACTIVE },
    { id: 'courier-002', name: 'Karim Ahmed', email: 'karim.courier@example.com', password: hashedPassword, phone: '+8801733333333', role: Role.COURIER, status: UserStatus.ACTIVE },
    { id: 'courier-003', name: 'Salman Hossain', email: 'salman.courier@example.com', password: hashedPassword, phone: '+8801744444444', role: Role.COURIER, status: UserStatus.ACTIVE },
    { id: 'courier-004', name: 'Jamal Uddin', email: 'jamal.courier@example.com', password: hashedPassword, phone: '+8801745555555', role: Role.COURIER, status: UserStatus.ACTIVE },
    { id: 'courier-005', name: 'Rafiq Islam', email: 'rafiq.courier@example.com', password: hashedPassword, phone: '+8801746666666', role: Role.COURIER, status: UserStatus.ACTIVE },
    { id: 'merchant-001', name: 'Fatima Begum', email: 'fatima@shopbd.com', password: hashedPassword, phone: '+8801755555555', role: Role.MERCHANT, status: UserStatus.ACTIVE },
    { id: 'merchant-002', name: 'Hasan Ali', email: 'hasan@ecommerce.com', password: hashedPassword, phone: '+8801766666666', role: Role.MERCHANT, status: UserStatus.ACTIVE },
    { id: 'merchant-003', name: 'Nasrin Akter', email: 'nasrin@fashionbd.com', password: hashedPassword, phone: '+8801767777777', role: Role.MERCHANT, status: UserStatus.ACTIVE },
    { id: 'user-001', name: 'Ayesha Rahman', email: 'ayesha@example.com', password: hashedPassword, phone: '+8801777777777', role: Role.USER, status: UserStatus.ACTIVE },
    { id: 'user-002', name: 'Tanvir Islam', email: 'tanvir@example.com', password: hashedPassword, phone: '+8801788888888', role: Role.USER, status: UserStatus.ACTIVE },
    { id: 'user-003', name: 'Nadia Sultana', email: 'nadia@example.com', password: hashedPassword, phone: '+8801799999999', role: Role.USER, status: UserStatus.ACTIVE },
    { id: 'user-004', name: 'Imran Hossain', email: 'imran@example.com', password: hashedPassword, phone: '+8801780000000', role: Role.USER, status: UserStatus.ACTIVE },
    { id: 'user-005', name: 'Sadia Afrin', email: 'sadia@example.com', password: hashedPassword, phone: '+8801781111111', role: Role.USER, status: UserStatus.ACTIVE },
  ];

  for (const user of users) {
    await prisma.user.upsert({ where: { email: user.email }, update: user, create: user });
  }
  console.log('✅ Users seeded\n');

  // ============================================
  // 4. COURIERS (FK: userId → User)
  // ============================================
  console.log('🚴 Seeding Couriers...');
  const couriers = [
    { id: 'courier-profile-001', userId: 'courier-001', vehicleType: VehicleType.BIKE, licenseNumber: 'DH-BIKE-12345', city: 'Dhaka', availability: true, approvalStatus: ApprovalStatus.APPROVED, totalEarnings: 5420.5 },
    { id: 'courier-profile-002', userId: 'courier-002', vehicleType: VehicleType.BICYCLE, licenseNumber: 'CTG-CYCLE-67890', city: 'Chittagong', availability: true, approvalStatus: ApprovalStatus.APPROVED, totalEarnings: 3210.0 },
    { id: 'courier-profile-003', userId: 'courier-003', vehicleType: VehicleType.VAN, licenseNumber: 'DH-VAN-11223', city: 'Dhaka', availability: false, approvalStatus: ApprovalStatus.PENDING, totalEarnings: 0 },
    { id: 'courier-profile-004', userId: 'courier-004', vehicleType: VehicleType.CAR, licenseNumber: 'SYL-CAR-44556', city: 'Sylhet', availability: true, approvalStatus: ApprovalStatus.APPROVED, totalEarnings: 2150.75 },
    { id: 'courier-profile-005', userId: 'courier-005', vehicleType: VehicleType.TRUCK, licenseNumber: 'KHL-TRUCK-78901', city: 'Khulna', availability: true, approvalStatus: ApprovalStatus.APPROVED, totalEarnings: 1890.0 },
  ];

  for (const courier of couriers) {
    await prisma.courier.upsert({ where: { userId: courier.userId }, update: courier, create: courier });
  }
  console.log('✅ Couriers seeded\n');

  // ============================================
  // 5. MERCHANTS (FK: userId → User)
  // ============================================
  console.log('🏢 Seeding Merchants...');
  const merchants = [
    { id: 'merchant-profile-001', userId: 'merchant-001', companyName: 'ShopBD Online Store', address: '45 Gulshan Avenue, Dhaka 1212' },
    { id: 'merchant-profile-002', userId: 'merchant-002', companyName: 'E-Commerce Hub Ltd', address: '78 Banani Road, Dhaka 1213' },
    { id: 'merchant-profile-003', userId: 'merchant-003', companyName: 'Fashion BD', address: '90 Dhanmondi Road 27, Dhaka 1209' },
  ];

  for (const merchant of merchants) {
    await prisma.merchant.upsert({ where: { userId: merchant.userId }, update: merchant, create: merchant });
  }
  console.log('✅ Merchants seeded\n');

  // ============================================
  // 6. SHIPMENTS (FK: senderId, merchantId?, courierId?)
  // ============================================
  console.log('📦 Seeding Shipments...');
  const shipments = [
    { id: 'shipment-001', trackingNumber: 'TRK-DELIVERED-001', senderId: 'user-001', merchantId: null, courierId: 'courier-profile-001', pickupAddress: '12 Dhanmondi Road 5, Dhaka', pickupCity: 'Dhaka', pickupPhone: '+8801777777777', deliveryAddress: '34 Mirpur DOHS, Dhaka', deliveryCity: 'Dhaka', deliveryPhone: '+8801888888888', packageType: 'Electronics', weight: 2.5, priority: Priority.STANDARD, status: ShipmentStatus.DELIVERED, paymentStatus: PaymentStatus.PAID, proofOfDelivery: 'https://cloudinary.com/proof-001.jpg', deliveryType: DeliveryType.DIRECT },
    { id: 'shipment-002', trackingNumber: 'TRK-TRANSIT-002', senderId: 'merchant-001', merchantId: 'merchant-profile-001', courierId: 'courier-profile-002', pickupAddress: '45 Gulshan Avenue, Dhaka', pickupCity: 'Dhaka', pickupPhone: '+8801755555555', deliveryAddress: '89 Agrabad, Chittagong', deliveryCity: 'Chittagong', deliveryPhone: '+8801999999999', packageType: 'Clothing', weight: 1.2, priority: Priority.EXPRESS, status: ShipmentStatus.IN_TRANSIT, paymentStatus: PaymentStatus.PAID, proofOfDelivery: null, deliveryType: DeliveryType.HUB_BASED },
    { id: 'shipment-003', trackingNumber: 'TRK-PENDING-003', senderId: 'user-002', merchantId: null, courierId: null, pickupAddress: '56 Uttara Sector 7, Dhaka', pickupCity: 'Dhaka', pickupPhone: '+8801788888888', deliveryAddress: '23 Khulna Sadar, Khulna', deliveryCity: 'Khulna', deliveryPhone: '+8801666666666', packageType: 'Documents', weight: 0.5, priority: Priority.STANDARD, status: ShipmentStatus.PENDING, paymentStatus: PaymentStatus.PENDING, proofOfDelivery: null, deliveryType: DeliveryType.HUB_BASED },
    { id: 'shipment-004', trackingNumber: 'TRK-ASSIGNED-004', senderId: 'merchant-002', merchantId: 'merchant-profile-002', courierId: 'courier-profile-001', pickupAddress: '78 Banani Road, Dhaka', pickupCity: 'Dhaka', pickupPhone: '+8801766666666', deliveryAddress: '12 Sylhet Zindabazar, Sylhet', deliveryCity: 'Sylhet', deliveryPhone: '+8801555555555', packageType: 'Books', weight: 3.0, priority: Priority.EXPRESS, status: ShipmentStatus.ASSIGNED, paymentStatus: PaymentStatus.PAID, proofOfDelivery: null, deliveryType: DeliveryType.HUB_BASED },
    { id: 'shipment-005', trackingNumber: 'TRK-OUTDELIVERY-005', senderId: 'user-003', merchantId: null, courierId: 'courier-profile-001', pickupAddress: '90 Mohammadpur, Dhaka', pickupCity: 'Dhaka', pickupPhone: '+8801799999999', deliveryAddress: '45 Bashundhara R/A, Dhaka', deliveryCity: 'Dhaka', deliveryPhone: '+8801444444444', packageType: 'Food Items', weight: 1.8, priority: Priority.STANDARD, status: ShipmentStatus.OUT_FOR_DELIVERY, paymentStatus: PaymentStatus.COD, proofOfDelivery: null, deliveryType: DeliveryType.DIRECT },
    { id: 'shipment-006', trackingNumber: 'TRK-INTL-006', senderId: 'merchant-001', merchantId: 'merchant-profile-001', courierId: null, pickupAddress: '45 Gulshan Avenue, Dhaka', pickupCity: 'Dhaka', pickupPhone: '+8801755555555', deliveryAddress: '123 Main St, New York, USA', deliveryCity: 'New York', deliveryPhone: '+12125551234', packageType: 'Handicrafts', weight: 5.0, priority: Priority.EXPRESS, status: ShipmentStatus.PENDING, paymentStatus: PaymentStatus.PENDING, proofOfDelivery: null, deliveryType: DeliveryType.HUB_BASED },
    { id: 'shipment-007', trackingNumber: 'TRK-PICKEDUP-007', senderId: 'user-004', merchantId: null, courierId: 'courier-profile-004', pickupAddress: '22 Banani, Dhaka', pickupCity: 'Dhaka', pickupPhone: '+8801780000000', deliveryAddress: '55 Zindabazar, Sylhet', deliveryCity: 'Sylhet', deliveryPhone: '+8801782222222', packageType: 'Gifts', weight: 2.0, priority: Priority.STANDARD, status: ShipmentStatus.PICKED_UP, paymentStatus: PaymentStatus.PAID, proofOfDelivery: null, deliveryType: DeliveryType.HUB_BASED },
    { id: 'shipment-008', trackingNumber: 'TRK-FAILED-008', senderId: 'user-005', merchantId: null, courierId: 'courier-profile-005', pickupAddress: '11 Uttara, Dhaka', pickupCity: 'Dhaka', pickupPhone: '+8801781111111', deliveryAddress: '88 Sonadanga, Khulna', deliveryCity: 'Khulna', deliveryPhone: '+8801783333333', packageType: 'Fragile Items', weight: 4.5, priority: Priority.EXPRESS, status: ShipmentStatus.FAILED, paymentStatus: PaymentStatus.FAILED, proofOfDelivery: null, deliveryType: DeliveryType.HUB_BASED },
  ];

  for (const shipment of shipments) {
    await prisma.shipment.upsert({ where: { trackingNumber: shipment.trackingNumber }, update: shipment, create: shipment });
  }
  console.log('✅ Shipments seeded\n');

  // ============================================
  // 7. PAYMENTS (FK: shipmentId → Shipment)
  // ============================================
  console.log('💳 Seeding Payments...');
  const payments = [
    { id: 'payment-001', shipmentId: 'shipment-001', amount: 100.0, method: PaymentMethod.STRIPE, status: PaymentStatus.PAID, transactionId: 'pi_3AbCdEfGhIjKlMnO' },
    { id: 'payment-002', shipmentId: 'shipment-002', amount: 312.5, method: PaymentMethod.STRIPE, status: PaymentStatus.PAID, transactionId: 'pi_3XyZaBcDeFgHiJkL' },
    { id: 'payment-003', shipmentId: 'shipment-003', amount: 115.0, method: PaymentMethod.COD, status: PaymentStatus.PENDING, transactionId: null },
    { id: 'payment-004', shipmentId: 'shipment-004', amount: 262.5, method: PaymentMethod.STRIPE, status: PaymentStatus.PAID, transactionId: 'pi_3QwErTyUiOpAsDfG' },
    { id: 'payment-005', shipmentId: 'shipment-005', amount: 86.0, method: PaymentMethod.COD, status: PaymentStatus.COD, transactionId: null },
    { id: 'payment-006', shipmentId: 'shipment-006', amount: 1625.0, method: PaymentMethod.STRIPE, status: PaymentStatus.PENDING, transactionId: null },
    { id: 'payment-007', shipmentId: 'shipment-007', amount: 160.0, method: PaymentMethod.STRIPE, status: PaymentStatus.PAID, transactionId: 'pi_3MnOpQrStUvWxYz' },
    { id: 'payment-008', shipmentId: 'shipment-008', amount: 303.75, method: PaymentMethod.STRIPE, status: PaymentStatus.FAILED, transactionId: null },
  ];

  for (const payment of payments) {
    await prisma.payment.upsert({ where: { shipmentId: payment.shipmentId }, update: payment, create: payment });
  }
  console.log('✅ Payments seeded\n');

  // ============================================
  // 8. SHIPMENT PRICING (FK: shipmentId → Shipment)
  // ============================================
  console.log('💰 Seeding ShipmentPricing...');
  const shipmentPricings = [
    { id: 'pricing-001', shipmentId: 'shipment-001', regionType: RegionType.LOCAL, basePrice: 50.0, weightCharge: 50.0, priorityCharge: 0.0, totalPrice: 100.0 },
    { id: 'pricing-002', shipmentId: 'shipment-002', regionType: RegionType.NATIONAL, basePrice: 100.0, weightCharge: 36.0, priorityCharge: 176.5, totalPrice: 312.5 },
    { id: 'pricing-003', shipmentId: 'shipment-003', regionType: RegionType.NATIONAL, basePrice: 100.0, weightCharge: 15.0, priorityCharge: 0.0, totalPrice: 115.0 },
    { id: 'pricing-004', shipmentId: 'shipment-004', regionType: RegionType.NATIONAL, basePrice: 100.0, weightCharge: 90.0, priorityCharge: 72.5, totalPrice: 262.5 },
    { id: 'pricing-005', shipmentId: 'shipment-005', regionType: RegionType.LOCAL, basePrice: 50.0, weightCharge: 36.0, priorityCharge: 0.0, totalPrice: 86.0 },
    { id: 'pricing-006', shipmentId: 'shipment-006', regionType: RegionType.INTERNATIONAL, basePrice: 500.0, weightCharge: 750.0, priorityCharge: 375.0, totalPrice: 1625.0 },
    { id: 'pricing-007', shipmentId: 'shipment-007', regionType: RegionType.NATIONAL, basePrice: 100.0, weightCharge: 60.0, priorityCharge: 0.0, totalPrice: 160.0 },
    { id: 'pricing-008', shipmentId: 'shipment-008', regionType: RegionType.NATIONAL, basePrice: 100.0, weightCharge: 135.0, priorityCharge: 68.75, totalPrice: 303.75 },
  ];

  for (const pricing of shipmentPricings) {
    await prisma.shipmentPricing.upsert({ where: { shipmentId: pricing.shipmentId }, update: pricing, create: pricing });
  }
  console.log('✅ ShipmentPricing seeded\n');

  // ============================================
  // 9. SHIPMENT LEGS (FK: shipmentId → Shipment, courierId → Courier, hubIds → Hub)
  // ============================================
  console.log('🚚 Seeding ShipmentLegs...');
  const shipmentLegs = [
    // Shipment 001 - DIRECT delivery (Dhaka to Dhaka) - COMPLETED
    { shipmentId: 'shipment-001', legNumber: 1, legType: LegType.DIRECT, originType: LocationType.ADDRESS, originAddress: '12 Dhanmondi Road 5, Dhaka', originHubId: null, destType: LocationType.ADDRESS, destAddress: '34 Mirpur DOHS, Dhaka', destHubId: null, courierId: 'courier-profile-001', status: LegStatus.COMPLETED, assignedAt: new Date('2024-01-15T08:00:00Z'), pickedUpAt: new Date('2024-01-15T09:00:00Z'), deliveredAt: new Date('2024-01-15T11:30:00Z') },
    
    // Shipment 002 - HUB_BASED (Dhaka to Chittagong) - IN_PROGRESS on leg 2
    { shipmentId: 'shipment-002', legNumber: 1, legType: LegType.PICKUP, originType: LocationType.ADDRESS, originAddress: '45 Gulshan Avenue, Dhaka', originHubId: null, destType: LocationType.HUB, destAddress: null, destHubId: 'hub-dhaka-regional', courierId: 'courier-profile-001', status: LegStatus.COMPLETED, assignedAt: new Date('2024-01-16T07:00:00Z'), pickedUpAt: new Date('2024-01-16T08:00:00Z'), deliveredAt: new Date('2024-01-16T09:30:00Z') },
    { shipmentId: 'shipment-002', legNumber: 2, legType: LegType.HUB_TRANSFER, originType: LocationType.HUB, originAddress: null, originHubId: 'hub-dhaka-regional', destType: LocationType.HUB, destAddress: null, destHubId: 'hub-chittagong-regional', courierId: 'courier-profile-002', status: LegStatus.IN_PROGRESS, assignedAt: new Date('2024-01-16T10:00:00Z'), pickedUpAt: new Date('2024-01-16T11:00:00Z'), deliveredAt: null },
    { shipmentId: 'shipment-002', legNumber: 3, legType: LegType.DELIVERY, originType: LocationType.HUB, originAddress: null, originHubId: 'hub-chittagong-regional', destType: LocationType.ADDRESS, destAddress: '89 Agrabad, Chittagong', destHubId: null, courierId: null, status: LegStatus.PENDING, assignedAt: null, pickedUpAt: null, deliveredAt: null },
    
    // Shipment 003 - HUB_BASED (Dhaka to Khulna) - All PENDING
    { shipmentId: 'shipment-003', legNumber: 1, legType: LegType.PICKUP, originType: LocationType.ADDRESS, originAddress: '56 Uttara Sector 7, Dhaka', originHubId: null, destType: LocationType.HUB, destAddress: null, destHubId: 'hub-dhaka-central', courierId: null, status: LegStatus.PENDING, assignedAt: null, pickedUpAt: null, deliveredAt: null },
    { shipmentId: 'shipment-003', legNumber: 2, legType: LegType.HUB_TRANSFER, originType: LocationType.HUB, originAddress: null, originHubId: 'hub-dhaka-central', destType: LocationType.HUB, destAddress: null, destHubId: 'hub-khulna', courierId: null, status: LegStatus.PENDING, assignedAt: null, pickedUpAt: null, deliveredAt: null },
    { shipmentId: 'shipment-003', legNumber: 3, legType: LegType.DELIVERY, originType: LocationType.HUB, originAddress: null, originHubId: 'hub-khulna', destType: LocationType.ADDRESS, destAddress: '23 Khulna Sadar, Khulna', destHubId: null, courierId: null, status: LegStatus.PENDING, assignedAt: null, pickedUpAt: null, deliveredAt: null },
    
    // Shipment 004 - HUB_BASED (Dhaka to Sylhet) - ASSIGNED (leg 1)
    { shipmentId: 'shipment-004', legNumber: 1, legType: LegType.PICKUP, originType: LocationType.ADDRESS, originAddress: '78 Banani Road, Dhaka', originHubId: null, destType: LocationType.HUB, destAddress: null, destHubId: 'hub-dhaka-regional', courierId: 'courier-profile-001', status: LegStatus.ASSIGNED, assignedAt: new Date('2024-01-17T08:00:00Z'), pickedUpAt: null, deliveredAt: null },
    { shipmentId: 'shipment-004', legNumber: 2, legType: LegType.HUB_TRANSFER, originType: LocationType.HUB, originAddress: null, originHubId: 'hub-dhaka-regional', destType: LocationType.HUB, destAddress: null, destHubId: 'hub-sylhet', courierId: null, status: LegStatus.PENDING, assignedAt: null, pickedUpAt: null, deliveredAt: null },
    { shipmentId: 'shipment-004', legNumber: 3, legType: LegType.DELIVERY, originType: LocationType.HUB, originAddress: null, originHubId: 'hub-sylhet', destType: LocationType.ADDRESS, destAddress: '12 Sylhet Zindabazar, Sylhet', destHubId: null, courierId: null, status: LegStatus.PENDING, assignedAt: null, pickedUpAt: null, deliveredAt: null },
    
    // Shipment 005 - DIRECT delivery (Dhaka to Dhaka) - IN_PROGRESS
    { shipmentId: 'shipment-005', legNumber: 1, legType: LegType.DIRECT, originType: LocationType.ADDRESS, originAddress: '90 Mohammadpur, Dhaka', originHubId: null, destType: LocationType.ADDRESS, destAddress: '45 Bashundhara R/A, Dhaka', destHubId: null, courierId: 'courier-profile-001', status: LegStatus.IN_PROGRESS, assignedAt: new Date('2024-01-18T07:00:00Z'), pickedUpAt: new Date('2024-01-18T08:00:00Z'), deliveredAt: null },
    
    // Shipment 006 - INTERNATIONAL (Dhaka to New York) - All PENDING
    { shipmentId: 'shipment-006', legNumber: 1, legType: LegType.PICKUP, originType: LocationType.ADDRESS, originAddress: '45 Gulshan Avenue, Dhaka', originHubId: null, destType: LocationType.HUB, destAddress: null, destHubId: 'hub-dhaka-regional', courierId: null, status: LegStatus.PENDING, assignedAt: null, pickedUpAt: null, deliveredAt: null },
    { shipmentId: 'shipment-006', legNumber: 2, legType: LegType.HUB_TRANSFER, originType: LocationType.HUB, originAddress: null, originHubId: 'hub-dhaka-regional', destType: LocationType.HUB, destAddress: null, destHubId: 'hub-dhaka-intl', courierId: null, status: LegStatus.PENDING, assignedAt: null, pickedUpAt: null, deliveredAt: null },
    { shipmentId: 'shipment-006', legNumber: 3, legType: LegType.DELIVERY, originType: LocationType.HUB, originAddress: null, originHubId: 'hub-dhaka-intl', destType: LocationType.ADDRESS, destAddress: '123 Main St, New York, USA', destHubId: null, courierId: null, status: LegStatus.PENDING, assignedAt: null, pickedUpAt: null, deliveredAt: null },
    
    // Shipment 007 - HUB_BASED (Dhaka to Sylhet) - Leg 1 COMPLETED, Leg 2 ASSIGNED
    { shipmentId: 'shipment-007', legNumber: 1, legType: LegType.PICKUP, originType: LocationType.ADDRESS, originAddress: '22 Banani, Dhaka', originHubId: null, destType: LocationType.HUB, destAddress: null, destHubId: 'hub-dhaka-regional', courierId: 'courier-profile-001', status: LegStatus.COMPLETED, assignedAt: new Date('2024-01-19T06:00:00Z'), pickedUpAt: new Date('2024-01-19T07:00:00Z'), deliveredAt: new Date('2024-01-19T08:30:00Z') },
    { shipmentId: 'shipment-007', legNumber: 2, legType: LegType.HUB_TRANSFER, originType: LocationType.HUB, originAddress: null, originHubId: 'hub-dhaka-regional', destType: LocationType.HUB, destAddress: null, destHubId: 'hub-sylhet', courierId: 'courier-profile-004', status: LegStatus.ASSIGNED, assignedAt: new Date('2024-01-19T09:00:00Z'), pickedUpAt: null, deliveredAt: null },
    { shipmentId: 'shipment-007', legNumber: 3, legType: LegType.DELIVERY, originType: LocationType.HUB, originAddress: null, originHubId: 'hub-sylhet', destType: LocationType.ADDRESS, destAddress: '55 Zindabazar, Sylhet', destHubId: null, courierId: null, status: LegStatus.PENDING, assignedAt: null, pickedUpAt: null, deliveredAt: null },
    
    // Shipment 008 - HUB_BASED (Dhaka to Khulna) - FAILED on leg 2
    { shipmentId: 'shipment-008', legNumber: 1, legType: LegType.PICKUP, originType: LocationType.ADDRESS, originAddress: '11 Uttara, Dhaka', originHubId: null, destType: LocationType.HUB, destAddress: null, destHubId: 'hub-dhaka-central', courierId: 'courier-profile-001', status: LegStatus.COMPLETED, assignedAt: new Date('2024-01-20T06:00:00Z'), pickedUpAt: new Date('2024-01-20T07:00:00Z'), deliveredAt: new Date('2024-01-20T08:00:00Z') },
    { shipmentId: 'shipment-008', legNumber: 2, legType: LegType.HUB_TRANSFER, originType: LocationType.HUB, originAddress: null, originHubId: 'hub-dhaka-central', destType: LocationType.HUB, destAddress: null, destHubId: 'hub-khulna', courierId: 'courier-profile-005', status: LegStatus.FAILED, assignedAt: new Date('2024-01-20T09:00:00Z'), pickedUpAt: new Date('2024-01-20T10:00:00Z'), deliveredAt: null },
    { shipmentId: 'shipment-008', legNumber: 3, legType: LegType.DELIVERY, originType: LocationType.HUB, originAddress: null, originHubId: 'hub-khulna', destType: LocationType.ADDRESS, destAddress: '88 Sonadanga, Khulna', destHubId: null, courierId: null, status: LegStatus.PENDING, assignedAt: null, pickedUpAt: null, deliveredAt: null },
  ];

  for (const leg of shipmentLegs) {
    await prisma.shipmentLeg.create({ data: leg });
  }
  console.log('✅ ShipmentLegs seeded\n');

  // ============================================
  // 10. SHIPMENT EVENTS (FK: shipmentId → Shipment)
  // ============================================
  console.log('📋 Seeding ShipmentEvents...');
  const shipmentEvents = [
    // Shipment 001 - Full lifecycle
    { shipmentId: 'shipment-001', status: ShipmentStatus.PENDING, updatedBy: 'user-001', note: 'Shipment created', timestamp: new Date('2024-01-15T07:00:00Z') },
    { shipmentId: 'shipment-001', status: ShipmentStatus.ASSIGNED, updatedBy: 'admin-001', note: 'Assigned to Rahim Khan', timestamp: new Date('2024-01-15T08:00:00Z') },
    { shipmentId: 'shipment-001', status: ShipmentStatus.PICKED_UP, updatedBy: 'courier-001', note: 'Package picked up from sender', timestamp: new Date('2024-01-15T09:00:00Z') },
    { shipmentId: 'shipment-001', status: ShipmentStatus.IN_TRANSIT, updatedBy: 'courier-001', note: 'On the way to destination', timestamp: new Date('2024-01-15T10:00:00Z') },
    { shipmentId: 'shipment-001', status: ShipmentStatus.OUT_FOR_DELIVERY, updatedBy: 'courier-001', note: 'Out for delivery', timestamp: new Date('2024-01-15T11:00:00Z') },
    { shipmentId: 'shipment-001', status: ShipmentStatus.DELIVERED, updatedBy: 'courier-001', note: 'Successfully delivered', timestamp: new Date('2024-01-15T11:30:00Z') },
    
    // Shipment 002 - In transit
    { shipmentId: 'shipment-002', status: ShipmentStatus.PENDING, updatedBy: 'merchant-001', note: 'Shipment created by merchant', timestamp: new Date('2024-01-16T06:00:00Z') },
    { shipmentId: 'shipment-002', status: ShipmentStatus.ASSIGNED, updatedBy: 'admin-001', note: 'Assigned to Karim Ahmed', timestamp: new Date('2024-01-16T07:00:00Z') },
    { shipmentId: 'shipment-002', status: ShipmentStatus.PICKED_UP, updatedBy: 'courier-002', note: 'Picked up from ShopBD', timestamp: new Date('2024-01-16T08:00:00Z') },
    { shipmentId: 'shipment-002', status: ShipmentStatus.IN_TRANSIT, updatedBy: 'courier-002', note: 'En route to Chittagong via hub', timestamp: new Date('2024-01-16T11:00:00Z') },
    
    // Shipment 003 - Pending
    { shipmentId: 'shipment-003', status: ShipmentStatus.PENDING, updatedBy: 'user-002', note: 'Awaiting courier assignment', timestamp: new Date('2024-01-17T05:00:00Z') },
    
    // Shipment 004 - Assigned
    { shipmentId: 'shipment-004', status: ShipmentStatus.PENDING, updatedBy: 'merchant-002', note: 'Shipment created', timestamp: new Date('2024-01-17T06:00:00Z') },
    { shipmentId: 'shipment-004', status: ShipmentStatus.ASSIGNED, updatedBy: 'admin-001', note: 'Assigned to Rahim Khan', timestamp: new Date('2024-01-17T08:00:00Z') },
    
    // Shipment 005 - Out for delivery
    { shipmentId: 'shipment-005', status: ShipmentStatus.PENDING, updatedBy: 'user-003', note: 'Shipment created', timestamp: new Date('2024-01-18T06:00:00Z') },
    { shipmentId: 'shipment-005', status: ShipmentStatus.ASSIGNED, updatedBy: 'admin-001', note: 'Assigned to Rahim Khan', timestamp: new Date('2024-01-18T07:00:00Z') },
    { shipmentId: 'shipment-005', status: ShipmentStatus.PICKED_UP, updatedBy: 'courier-001', note: 'Package collected', timestamp: new Date('2024-01-18T08:00:00Z') },
    { shipmentId: 'shipment-005', status: ShipmentStatus.IN_TRANSIT, updatedBy: 'courier-001', note: 'On the way', timestamp: new Date('2024-01-18T09:00:00Z') },
    { shipmentId: 'shipment-005', status: ShipmentStatus.OUT_FOR_DELIVERY, updatedBy: 'courier-001', note: 'Arriving soon', timestamp: new Date('2024-01-18T10:00:00Z') },
    
    // Shipment 006 - International pending
    { shipmentId: 'shipment-006', status: ShipmentStatus.PENDING, updatedBy: 'merchant-001', note: 'International shipment awaiting processing', timestamp: new Date('2024-01-19T05:00:00Z') },
    
    // Shipment 007 - Picked up
    { shipmentId: 'shipment-007', status: ShipmentStatus.PENDING, updatedBy: 'user-004', note: 'Shipment created', timestamp: new Date('2024-01-19T05:00:00Z') },
    { shipmentId: 'shipment-007', status: ShipmentStatus.ASSIGNED, updatedBy: 'courier-004', note: 'Courier accepted shipment', timestamp: new Date('2024-01-19T06:00:00Z') },
    { shipmentId: 'shipment-007', status: ShipmentStatus.PICKED_UP, updatedBy: 'courier-004', note: 'Package picked up and delivered to hub', timestamp: new Date('2024-01-19T08:30:00Z') },
    
    // Shipment 008 - Failed
    { shipmentId: 'shipment-008', status: ShipmentStatus.PENDING, updatedBy: 'user-005', note: 'Shipment created', timestamp: new Date('2024-01-20T05:00:00Z') },
    { shipmentId: 'shipment-008', status: ShipmentStatus.ASSIGNED, updatedBy: 'courier-005', note: 'Courier accepted shipment', timestamp: new Date('2024-01-20T06:00:00Z') },
    { shipmentId: 'shipment-008', status: ShipmentStatus.PICKED_UP, updatedBy: 'courier-005', note: 'Package picked up', timestamp: new Date('2024-01-20T07:00:00Z') },
    { shipmentId: 'shipment-008', status: ShipmentStatus.FAILED, updatedBy: 'courier-005', note: 'Delivery failed due to vehicle breakdown', timestamp: new Date('2024-01-20T11:00:00Z') },
  ];

  for (const event of shipmentEvents) {
    await prisma.shipmentEvent.create({ data: event });
  }
  console.log('✅ ShipmentEvents seeded\n');

  // ============================================
  // 11. NOTIFICATIONS (FK: userId → User, shipmentId → Shipment)
  // ============================================
  console.log('🔔 Seeding Notifications...');
  const notifications = [
    // User notifications
    { userId: 'user-001', shipmentId: 'shipment-001', role: Role.USER, message: 'Your shipment TRK-DELIVERED-001 has been delivered successfully!', readStatus: true },
    { userId: 'user-001', shipmentId: 'shipment-001', role: Role.USER, message: 'Your shipment is out for delivery', readStatus: true },
    { userId: 'user-002', shipmentId: 'shipment-003', role: Role.USER, message: 'Your shipment TRK-PENDING-003 is awaiting courier assignment', readStatus: false },
    { userId: 'user-003', shipmentId: 'shipment-005', role: Role.USER, message: 'Your shipment is out for delivery and will arrive soon!', readStatus: false },
    { userId: 'user-004', shipmentId: 'shipment-007', role: Role.USER, message: 'Your shipment TRK-PICKEDUP-007 has been picked up', readStatus: false },
    { userId: 'user-005', shipmentId: 'shipment-008', role: Role.USER, message: 'Your shipment TRK-FAILED-008 delivery failed. We will retry soon.', readStatus: false },
    
    // Merchant notifications
    { userId: 'merchant-001', shipmentId: 'shipment-002', role: Role.MERCHANT, message: 'Shipment TRK-TRANSIT-002 is in transit to Chittagong', readStatus: false },
    { userId: 'merchant-001', shipmentId: 'shipment-006', role: Role.MERCHANT, message: 'International shipment TRK-INTL-006 created successfully', readStatus: false },
    { userId: 'merchant-002', shipmentId: 'shipment-004', role: Role.MERCHANT, message: 'Shipment TRK-ASSIGNED-004 has been assigned to a courier', readStatus: false },
    { userId: 'merchant-003', shipmentId: 'shipment-002', role: Role.MERCHANT, message: 'New order notification', readStatus: true },
    
    // Courier notifications
    { userId: 'courier-001', shipmentId: 'shipment-001', role: Role.COURIER, message: 'You have successfully delivered shipment TRK-DELIVERED-001', readStatus: true },
    { userId: 'courier-001', shipmentId: 'shipment-004', role: Role.COURIER, message: 'New shipment TRK-ASSIGNED-004 assigned to you', readStatus: false },
    { userId: 'courier-001', shipmentId: 'shipment-005', role: Role.COURIER, message: 'Shipment TRK-OUTDELIVERY-005 is ready for delivery', readStatus: false },
    { userId: 'courier-002', shipmentId: 'shipment-002', role: Role.COURIER, message: 'Shipment TRK-TRANSIT-002 in progress', readStatus: false },
    { userId: 'courier-004', shipmentId: 'shipment-007', role: Role.COURIER, message: 'New leg assigned for shipment TRK-PICKEDUP-007', readStatus: false },
    { userId: 'courier-005', shipmentId: 'shipment-008', role: Role.COURIER, message: 'Shipment TRK-FAILED-008 marked as failed', readStatus: true },
    
    // Admin notifications
    { userId: 'admin-001', shipmentId: 'shipment-003', role: Role.ADMIN, message: 'New shipment TRK-PENDING-003 awaiting assignment', readStatus: false },
    { userId: 'admin-001', shipmentId: 'shipment-006', role: Role.ADMIN, message: 'International shipment TRK-INTL-006 requires processing', readStatus: false },
  ];

  for (const notification of notifications) {
    await prisma.notification.create({ data: notification });
  }
  console.log('✅ Notifications seeded\n');

  console.log('🎉 Database seeding completed successfully!\n');
  console.log('📊 Summary:');
  console.log('   - 3 Pricing tiers (LOCAL, NATIONAL, INTERNATIONAL)');
  console.log('   - 13 Hubs (10 Local, 2 Regional, 1 International)');
  console.log('   - 15 Users (2 Admins, 5 Couriers, 3 Merchants, 5 Regular Users)');
  console.log('   - 5 Courier profiles (Dhaka, Chittagong, Sylhet, Khulna)');
  console.log('   - 3 Merchant profiles');
  console.log('   - 8 Shipments (various statuses: DELIVERED, IN_TRANSIT, PENDING, ASSIGNED, OUT_FOR_DELIVERY, PICKED_UP, FAILED)');
  console.log('   - 8 Payments (PAID, PENDING, COD, FAILED)');
  console.log('   - 8 ShipmentPricing records');
  console.log('   - 26 ShipmentLegs (DIRECT, PICKUP, HUB_TRANSFER, DELIVERY)');
  console.log('   - 38 ShipmentEvents (full lifecycle tracking)');
  console.log('   - 18 Notifications (Users, Merchants, Couriers, Admins)\n');
  console.log('🔑 Test Credentials:');
  console.log('   Admin:       admin@courier.com / Password@123');
  console.log('   Super Admin: superadmin@courier.com / Password@123');
  console.log('   Courier:     rahim.courier@example.com / Password@123 (Dhaka, BIKE)');
  console.log('   Courier:     karim.courier@example.com / Password@123 (Chittagong, BICYCLE)');
  console.log('   Courier:     jamal.courier@example.com / Password@123 (Sylhet, CAR)');
  console.log('   Merchant:    fatima@shopbd.com / Password@123');
  console.log('   Merchant:    hasan@ecommerce.com / Password@123');
  console.log('   User:        ayesha@example.com / Password@123');
  console.log('   User:        tanvir@example.com / Password@123\n');
  console.log('🚚 Shipment Scenarios:');
  console.log('   - TRK-DELIVERED-001: Completed DIRECT delivery (Dhaka to Dhaka)');
  console.log('   - TRK-TRANSIT-002: HUB_BASED in transit (Dhaka to Chittagong)');
  console.log('   - TRK-PENDING-003: Awaiting courier assignment');
  console.log('   - TRK-ASSIGNED-004: Assigned, ready for pickup');
  console.log('   - TRK-OUTDELIVERY-005: Out for delivery (COD)');
  console.log('   - TRK-INTL-006: International shipment pending');
  console.log('   - TRK-PICKEDUP-007: Multi-leg with hub transfer');
  console.log('   - TRK-FAILED-008: Failed delivery scenario\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
