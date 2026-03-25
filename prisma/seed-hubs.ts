import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type HubType = 'LOCAL' | 'REGIONAL' | 'INTERNATIONAL';

const hubs: Array<{ name: string; city: string; address: string; hubType: HubType }> = [
  // Bangladesh Major Cities
  { name: 'Dhaka Central Hub', city: 'Dhaka', address: 'Gulshan-1, Dhaka 1212', hubType: 'LOCAL' as HubType },
  { name: 'Chittagong Hub', city: 'Chittagong', address: 'Agrabad, Chittagong 4100', hubType: 'LOCAL' as HubType },
  { name: 'Sylhet Hub', city: 'Sylhet', address: 'Zindabazar, Sylhet 3100', hubType: 'LOCAL' as HubType },
  { name: 'Rajshahi Hub', city: 'Rajshahi', address: 'Shaheb Bazar, Rajshahi 6100', hubType: 'LOCAL' as HubType },
  { name: 'Khulna Hub', city: 'Khulna', address: 'Sonadanga, Khulna 9100', hubType: 'LOCAL' as HubType },
  { name: 'Barisal Hub', city: 'Barisal', address: 'Sadar Road, Barisal 8200', hubType: 'LOCAL' as HubType },
  { name: 'Rangpur Hub', city: 'Rangpur', address: 'Station Road, Rangpur 5400', hubType: 'LOCAL' as HubType },
  { name: 'Mymensingh Hub', city: 'Mymensingh', address: 'Charpara, Mymensingh 2200', hubType: 'LOCAL' as HubType },
  { name: 'Comilla Hub', city: 'Comilla', address: 'Kandirpar, Comilla 3500', hubType: 'LOCAL' as HubType },
  { name: 'Gazipur Hub', city: 'Gazipur', address: 'Joydebpur, Gazipur 1700', hubType: 'LOCAL' as HubType },

  // Regional Hubs
  { name: 'Dhaka Regional Hub', city: 'Dhaka', address: 'Uttara, Dhaka 1230', hubType: 'REGIONAL' as HubType },
  { name: 'Chittagong Regional Hub', city: 'Chittagong', address: 'Patenga, Chittagong 4200', hubType: 'REGIONAL' as HubType },

  // International Hub
  { name: 'Dhaka International Hub', city: 'Dhaka', address: 'Hazrat Shahjalal International Airport, Dhaka 1229', hubType: 'INTERNATIONAL' as HubType },
];

async function seedHubs() {
  console.log('🌱 Seeding hubs...');

  for (const hub of hubs) {
    const existing = await prisma.hub.findFirst({
      where: { city: hub.city, hubType: hub.hubType },
    });

    if (existing) {
      console.log(`✅ Hub already exists: ${hub.name}`);
      continue;
    }

    await prisma.hub.create({ data: hub });
    console.log(`✅ Created hub: ${hub.name}`);
  }

  console.log('🎉 Hub seeding completed!');
}

seedHubs()
  .catch((e) => {
    console.error('❌ Error seeding hubs:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
