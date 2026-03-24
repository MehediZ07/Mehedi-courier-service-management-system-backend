import { PrismaClient, Role, UserStatus, VehicleType, ApprovalStatus, ShipmentStatus, Priority, PaymentStatus, PaymentMethod, RegionType } from '../src/app/generated/prisma/index.js';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...\n');

  // ============================================
  // 1. PRICING (No FK dependencies)
  // ============================================
  console.log('📊 Seeding Pricing...');
  const pricingData = [
    {
      regionType: RegionType.LOCAL,
      basePrice: 50,
      perKgPrice: 20,
      expressMult: 1.2,
    },
    {
      regionType: RegionType.NATIONAL,
      basePrice: 100,
      perKgPrice: 30,
      expressMult: 1.25,
    },
    {
      regionType: RegionType.INTERNATIONAL,
      basePrice: 500,
      perKgPrice: 150,
      expressMult: 1.5,
    },
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
  // 2. USERS (No FK dependencies)
  // ============================================
  console.log('👥 Seeding Users...');
  const hashedPassword = await bcrypt.hash('Password@123', 10);

  const users = [
    // Admin
    {
      id: 'admin-001',
      name: 'Admin User',
      email: 'admin@courier.com',
      password: hashedPassword,
      phone: '+8801711111111',
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
    // Couriers
    {
      id: 'courier-001',
      name: 'Rahim Khan',
      email: 'rahim.courier@example.com',
      password: hashedPassword,
      phone: '+8801722222222',
      role: Role.COURIER,
      status: UserStatus.ACTIVE,
    },
    {
      id: 'courier-002',
      name: 'Karim Ahmed',
      email: 'karim.courier@example.com',
      password: hashedPassword,
      phone: '+8801733333333',
      role: Role.COURIER,
      status: UserStatus.ACTIVE,
    },
    {
      id: 'courier-003',
      name: 'Salman Hossain',
      email: 'salman.courier@example.com',
      password: hashedPassword,
      phone: '+8801744444444',
      role: Role.COURIER,
      status: UserStatus.ACTIVE,
    },
    // Merchants
    {
      id: 'merchant-001',
      name: 'Fatima Begum',
      email: 'fatima@shopbd.com',
      password: hashedPassword,
      phone: '+8801755555555',
      role: Role.MERCHANT,
      status: UserStatus.ACTIVE,
    },
    {
      id: 'merchant-002',
      name: 'Hasan Ali',
      email: 'hasan@ecommerce.com',
      password: hashedPassword,
      phone: '+8801766666666',
      role: Role.MERCHANT,
      status: UserStatus.ACTIVE,
    },
    // Regular Users
    {
      id: 'user-001',
      name: 'Ayesha Rahman',
      email: 'ayesha@example.com',
      password: hashedPassword,
      phone: '+8801777777777',
      role: Role.USER,
      status: UserStatus.ACTIVE,
    },
    {
      id: 'user-002',
      name: 'Tanvir Islam',
      email: 'tanvir@example.com',
      password: hashedPassword,
      phone: '+8801788888888',
      role: Role.USER,
      status: UserStatus.ACTIVE,
    },
    {
      id: 'user-003',
      name: 'Nadia Sultana',
      email: 'nadia@example.com',
      password: hashedPassword,
      phone: '+8801799999999',
      role: Role.USER,
      status: UserStatus.ACTIVE,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: user,
      create: user,
    });
  }
  console.log('✅ Users seeded\n');

  // ============================================
  // 3. COURIERS (FK: userId → User)
  // ============================================
  console.log('🚴 Seeding Couriers...');
  const couriers = [
    {
      id: 'courier-profile-001',
      userId: 'courier-001',
      vehicleType: VehicleType.BIKE,
      licenseNumber: 'DH-BIKE-12345',
      availability: true,
      approvalStatus: ApprovalStatus.APPROVED,
      totalEarnings: 5420.5,
    },
    {
      id: 'courier-profile-002',
      userId: 'courier-002',
      vehicleType: VehicleType.BICYCLE,
      licenseNumber: 'DH-CYCLE-67890',
      availability: true,
      approvalStatus: ApprovalStatus.APPROVED,
      totalEarnings: 3210.0,
    },
    {
      id: 'courier-profile-003',
      userId: 'courier-003',
      vehicleType: VehicleType.VAN,
      licenseNumber: 'DH-VAN-11223',
      availability: false,
      approvalStatus: ApprovalStatus.PENDING,
      totalEarnings: 0,
    },
  ];

  for (const courier of couriers) {
    await prisma.courier.upsert({
      where: { userId: courier.userId },
      update: courier,
      create: courier,
    });
  }
  console.log('✅ Couriers seeded\n');

  // ============================================
  // 4. MERCHANTS (FK: userId → User)
  // ============================================
  console.log('🏢 Seeding Merchants...');
  const merchants = [
    {
      id: 'merchant-profile-001',
      userId: 'merchant-001',
      companyName: 'ShopBD Online Store',
      address: '45 Gulshan Avenue, Dhaka 1212',
    },
    {
      id: 'merchant-profile-002',
      userId: 'merchant-002',
      companyName: 'E-Commerce Hub Ltd',
      address: '78 Banani Road, Dhaka 1213',
    },
  ];

  for (const merchant of merchants) {
    await prisma.merchant.upsert({
      where: { userId: merchant.userId },
      update: merchant,
      create: merchant,
    });
  }
  console.log('✅ Merchants seeded\n');

  // ============================================
  // 5. SHIPMENTS (FK: senderId, merchantId?, courierId?)
  // ============================================
  console.log('📦 Seeding Shipments...');
  const shipments = [
    // Delivered shipment
    {
      id: 'shipment-001',
      trackingNumber: 'TRK-DELIVERED-001',
      senderId: 'user-001',
      merchantId: null,
      courierId: 'courier-profile-001',
      pickupAddress: '12 Dhanmondi Road 5, Dhaka',
      pickupCity: 'Dhaka',
      deliveryAddress: '34 Mirpur DOHS, Dhaka',
      deliveryCity: 'Dhaka',
      packageType: 'Electronics',
      weight: 2.5,
      priority: Priority.STANDARD,
      status: ShipmentStatus.DELIVERED,
      paymentStatus: PaymentStatus.PAID,
      proofOfDelivery: 'https://cloudinary.com/proof-001.jpg',
    },
    // In transit shipment
    {
      id: 'shipment-002',
      trackingNumber: 'TRK-TRANSIT-002',
      senderId: 'merchant-001',
      merchantId: 'merchant-profile-001',
      courierId: 'courier-profile-002',
      pickupAddress: '45 Gulshan Avenue, Dhaka',
      pickupCity: 'Dhaka',
      deliveryAddress: '89 Agrabad, Chittagong',
      deliveryCity: 'Chittagong',
      packageType: 'Clothing',
      weight: 1.2,
      priority: Priority.EXPRESS,
      status: ShipmentStatus.IN_TRANSIT,
      paymentStatus: PaymentStatus.PAID,
      proofOfDelivery: null,
    },
    // Pending shipment (unassigned)
    {
      id: 'shipment-003',
      trackingNumber: 'TRK-PENDING-003',
      senderId: 'user-002',
      merchantId: null,
      courierId: null,
      pickupAddress: '56 Uttara Sector 7, Dhaka',
      pickupCity: 'Dhaka',
      deliveryAddress: '23 Khulna Sadar, Khulna',
      deliveryCity: 'Khulna',
      packageType: 'Documents',
      weight: 0.5,
      priority: Priority.STANDARD,
      status: ShipmentStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      proofOfDelivery: null,
    },
    // Assigned shipment
    {
      id: 'shipment-004',
      trackingNumber: 'TRK-ASSIGNED-004',
      senderId: 'merchant-002',
      merchantId: 'merchant-profile-002',
      courierId: 'courier-profile-001',
      pickupAddress: '78 Banani Road, Dhaka',
      pickupCity: 'Dhaka',
      deliveryAddress: '12 Sylhet Zindabazar, Sylhet',
      deliveryCity: 'Sylhet',
      packageType: 'Books',
      weight: 3.0,
      priority: Priority.EXPRESS,
      status: ShipmentStatus.ASSIGNED,
      paymentStatus: PaymentStatus.PAID,
      proofOfDelivery: null,
    },
    // Out for delivery
    {
      id: 'shipment-005',
      trackingNumber: 'TRK-OUTDELIVERY-005',
      senderId: 'user-003',
      merchantId: null,
      courierId: 'courier-profile-002',
      pickupAddress: '90 Mohammadpur, Dhaka',
      pickupCity: 'Dhaka',
      deliveryAddress: '45 Bashundhara R/A, Dhaka',
      deliveryCity: 'Dhaka',
      packageType: 'Food Items',
      weight: 1.8,
      priority: Priority.STANDARD,
      status: ShipmentStatus.OUT_FOR_DELIVERY,
      paymentStatus: PaymentStatus.COD,
      proofOfDelivery: null,
    },
    // International shipment
    {
      id: 'shipment-006',
      trackingNumber: 'TRK-INTL-006',
      senderId: 'merchant-001',
      merchantId: 'merchant-profile-001',
      courierId: null,
      pickupAddress: '45 Gulshan Avenue, Dhaka',
      pickupCity: 'Dhaka',
      deliveryAddress: '123 Main St, New York, USA',
      deliveryCity: 'New York',
      packageType: 'Handicrafts',
      weight: 5.0,
      priority: Priority.EXPRESS,
      status: ShipmentStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      proofOfDelivery: null,
    },
  ];

  for (const shipment of shipments) {
    await prisma.shipment.upsert({
      where: { trackingNumber: shipment.trackingNumber },
      update: shipment,
      create: shipment,
    });
  }
  console.log('✅ Shipments seeded\n');

  // ============================================
  // 6. PAYMENTS (FK: shipmentId → Shipment, 1-1)
  // ============================================
  console.log('💳 Seeding Payments...');
  const payments = [
    {
      id: 'payment-001',
      shipmentId: 'shipment-001',
      amount: 100.0,
      method: PaymentMethod.STRIPE,
      status: PaymentStatus.PAID,
      transactionId: 'pi_3AbCdEfGhIjKlMnO',
    },
    {
      id: 'payment-002',
      shipmentId: 'shipment-002',
      amount: 312.5,
      method: PaymentMethod.STRIPE,
      status: PaymentStatus.PAID,
      transactionId: 'pi_3XyZaBcDeFgHiJkL',
    },
    {
      id: 'payment-003',
      shipmentId: 'shipment-003',
      amount: 115.0,
      method: PaymentMethod.COD,
      status: PaymentStatus.PENDING,
      transactionId: null,
    },
    {
      id: 'payment-004',
      shipmentId: 'shipment-004',
      amount: 262.5,
      method: PaymentMethod.STRIPE,
      status: PaymentStatus.PAID,
      transactionId: 'pi_3QwErTyUiOpAsDfG',
    },
    {
      id: 'payment-005',
      shipmentId: 'shipment-005',
      amount: 86.0,
      method: PaymentMethod.COD,
      status: PaymentStatus.COD,
      transactionId: null,
    },
    {
      id: 'payment-006',
      shipmentId: 'shipment-006',
      amount: 1625.0,
      method: PaymentMethod.STRIPE,
      status: PaymentStatus.PENDING,
      transactionId: null,
    },
  ];

  for (const payment of payments) {
    await prisma.payment.upsert({
      where: { shipmentId: payment.shipmentId },
      update: payment,
      create: payment,
    });
  }
  console.log('✅ Payments seeded\n');

  // ============================================
  // 7. SHIPMENT PRICING (FK: shipmentId → Shipment, 1-1)
  // ============================================
  console.log('💰 Seeding ShipmentPricing...');
  const shipmentPricings = [
    {
      id: 'pricing-001',
      shipmentId: 'shipment-001',
      regionType: RegionType.LOCAL,
      basePrice: 50.0,
      weightCharge: 50.0,
      priorityCharge: 0.0,
      totalPrice: 100.0,
    },
    {
      id: 'pricing-002',
      shipmentId: 'shipment-002',
      regionType: RegionType.NATIONAL,
      basePrice: 100.0,
      weightCharge: 36.0,
      priorityCharge: 176.5,
      totalPrice: 312.5,
    },
    {
      id: 'pricing-003',
      shipmentId: 'shipment-003',
      regionType: RegionType.NATIONAL,
      basePrice: 100.0,
      weightCharge: 15.0,
      priorityCharge: 0.0,
      totalPrice: 115.0,
    },
    {
      id: 'pricing-004',
      shipmentId: 'shipment-004',
      regionType: RegionType.NATIONAL,
      basePrice: 100.0,
      weightCharge: 90.0,
      priorityCharge: 72.5,
      totalPrice: 262.5,
    },
    {
      id: 'pricing-005',
      shipmentId: 'shipment-005',
      regionType: RegionType.LOCAL,
      basePrice: 50.0,
      weightCharge: 36.0,
      priorityCharge: 0.0,
      totalPrice: 86.0,
    },
    {
      id: 'pricing-006',
      shipmentId: 'shipment-006',
      regionType: RegionType.INTERNATIONAL,
      basePrice: 500.0,
      weightCharge: 750.0,
      priorityCharge: 375.0,
      totalPrice: 1625.0,
    },
  ];

  for (const pricing of shipmentPricings) {
    await prisma.shipmentPricing.upsert({
      where: { shipmentId: pricing.shipmentId },
      update: pricing,
      create: pricing,
    });
  }
  console.log('✅ ShipmentPricing seeded\n');

  // ============================================
  // 8. SHIPMENT EVENTS (FK: shipmentId → Shipment)
  // ============================================
  console.log('📋 Seeding ShipmentEvents...');
  const shipmentEvents = [
    // Shipment 001 - Delivered
    { shipmentId: 'shipment-001', status: ShipmentStatus.PENDING, updatedBy: 'user-001', note: 'Shipment created' },
    { shipmentId: 'shipment-001', status: ShipmentStatus.ASSIGNED, updatedBy: 'admin-001', note: 'Assigned to Rahim Khan' },
    { shipmentId: 'shipment-001', status: ShipmentStatus.PICKED_UP, updatedBy: 'courier-001', note: 'Package picked up from sender' },
    { shipmentId: 'shipment-001', status: ShipmentStatus.IN_TRANSIT, updatedBy: 'courier-001', note: 'On the way to destination' },
    { shipmentId: 'shipment-001', status: ShipmentStatus.OUT_FOR_DELIVERY, updatedBy: 'courier-001', note: 'Out for delivery' },
    { shipmentId: 'shipment-001', status: ShipmentStatus.DELIVERED, updatedBy: 'courier-001', note: 'Successfully delivered' },
    
    // Shipment 002 - In Transit
    { shipmentId: 'shipment-002', status: ShipmentStatus.PENDING, updatedBy: 'merchant-001', note: 'Shipment created by merchant' },
    { shipmentId: 'shipment-002', status: ShipmentStatus.ASSIGNED, updatedBy: 'admin-001', note: 'Assigned to Karim Ahmed' },
    { shipmentId: 'shipment-002', status: ShipmentStatus.PICKED_UP, updatedBy: 'courier-002', note: 'Picked up from ShopBD' },
    { shipmentId: 'shipment-002', status: ShipmentStatus.IN_TRANSIT, updatedBy: 'courier-002', note: 'En route to Chittagong' },
    
    // Shipment 003 - Pending
    { shipmentId: 'shipment-003', status: ShipmentStatus.PENDING, updatedBy: 'user-002', note: 'Awaiting courier assignment' },
    
    // Shipment 004 - Assigned
    { shipmentId: 'shipment-004', status: ShipmentStatus.PENDING, updatedBy: 'merchant-002', note: 'Shipment created' },
    { shipmentId: 'shipment-004', status: ShipmentStatus.ASSIGNED, updatedBy: 'admin-001', note: 'Assigned to Rahim Khan' },
    
    // Shipment 005 - Out for Delivery
    { shipmentId: 'shipment-005', status: ShipmentStatus.PENDING, updatedBy: 'user-003', note: 'Shipment created' },
    { shipmentId: 'shipment-005', status: ShipmentStatus.ASSIGNED, updatedBy: 'admin-001', note: 'Assigned to Karim Ahmed' },
    { shipmentId: 'shipment-005', status: ShipmentStatus.PICKED_UP, updatedBy: 'courier-002', note: 'Package collected' },
    { shipmentId: 'shipment-005', status: ShipmentStatus.IN_TRANSIT, updatedBy: 'courier-002', note: 'On the way' },
    { shipmentId: 'shipment-005', status: ShipmentStatus.OUT_FOR_DELIVERY, updatedBy: 'courier-002', note: 'Arriving soon' },
    
    // Shipment 006 - International Pending
    { shipmentId: 'shipment-006', status: ShipmentStatus.PENDING, updatedBy: 'merchant-001', note: 'International shipment awaiting processing' },
  ];

  for (const event of shipmentEvents) {
    await prisma.shipmentEvent.create({ data: event });
  }
  console.log('✅ ShipmentEvents seeded\n');

  // ============================================
  // 9. NOTIFICATIONS (FK: userId → User, shipmentId → Shipment)
  // ============================================
  console.log('🔔 Seeding Notifications...');
  const notifications = [
    // User 001 notifications
    {
      userId: 'user-001',
      shipmentId: 'shipment-001',
      role: Role.USER,
      message: 'Your shipment TRK-DELIVERED-001 has been delivered successfully!',
      readStatus: true,
    },
    {
      userId: 'user-001',
      shipmentId: 'shipment-001',
      role: Role.USER,
      message: 'Your shipment is out for delivery',
      readStatus: true,
    },
    
    // Merchant 001 notifications
    {
      userId: 'merchant-001',
      shipmentId: 'shipment-002',
      role: Role.MERCHANT,
      message: 'Shipment TRK-TRANSIT-002 is in transit to Chittagong',
      readStatus: false,
    },
    {
      userId: 'merchant-001',
      shipmentId: 'shipment-006',
      role: Role.MERCHANT,
      message: 'International shipment TRK-INTL-006 created successfully',
      readStatus: false,
    },
    
    // User 002 notifications
    {
      userId: 'user-002',
      shipmentId: 'shipment-003',
      role: Role.USER,
      message: 'Your shipment TRK-PENDING-003 is awaiting courier assignment',
      readStatus: false,
    },
    
    // Merchant 002 notifications
    {
      userId: 'merchant-002',
      shipmentId: 'shipment-004',
      role: Role.MERCHANT,
      message: 'Shipment TRK-ASSIGNED-004 has been assigned to a courier',
      readStatus: false,
    },
    
    // User 003 notifications
    {
      userId: 'user-003',
      shipmentId: 'shipment-005',
      role: Role.USER,
      message: 'Your shipment is out for delivery and will arrive soon!',
      readStatus: false,
    },
    
    // Courier notifications
    {
      userId: 'courier-001',
      shipmentId: 'shipment-001',
      role: Role.COURIER,
      message: 'You have successfully delivered shipment TRK-DELIVERED-001',
      readStatus: true,
    },
    {
      userId: 'courier-001',
      shipmentId: 'shipment-004',
      role: Role.COURIER,
      message: 'New shipment TRK-ASSIGNED-004 assigned to you',
      readStatus: false,
    },
    {
      userId: 'courier-002',
      shipmentId: 'shipment-005',
      role: Role.COURIER,
      message: 'Shipment TRK-OUTDELIVERY-005 is ready for delivery',
      readStatus: false,
    },
  ];

  for (const notification of notifications) {
    await prisma.notification.create({ data: notification });
  }
  console.log('✅ Notifications seeded\n');

  console.log('🎉 Database seeding completed successfully!\n');
  console.log('📊 Summary:');
  console.log('   - 3 Pricing tiers');
  console.log('   - 9 Users (1 Admin, 3 Couriers, 2 Merchants, 3 Regular Users)');
  console.log('   - 3 Courier profiles');
  console.log('   - 2 Merchant profiles');
  console.log('   - 6 Shipments (various statuses)');
  console.log('   - 6 Payments');
  console.log('   - 6 ShipmentPricing records');
  console.log('   - 20 ShipmentEvents');
  console.log('   - 10 Notifications\n');
  console.log('🔑 Test Credentials:');
  console.log('   Admin:    admin@courier.com / Password@123');
  console.log('   Courier:  rahim.courier@example.com / Password@123');
  console.log('   Merchant: fatima@shopbd.com / Password@123');
  console.log('   User:     ayesha@example.com / Password@123\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
