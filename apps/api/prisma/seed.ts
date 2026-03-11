import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { phone: '+2340000000000' },
    update: {},
    create: {
      phone: '+2340000000000',
      role: 'ADMIN',
      authIdentities: {
        create: { provider: 'PHONE', providerId: '+2340000000000' },
      },
    },
  });
  console.log(`Admin created: ${admin.id}`);

  // Create test vendors
  const vendorUsers = [
    { phone: '+2348011111111', name: 'Lagos Eats Catering', category: 'CATERER' as const, area: 'Lekki' },
    { phone: '+2348022222222', name: 'SnapShot Studios', category: 'PHOTOGRAPHER' as const, area: 'Victoria Island' },
    { phone: '+2348033333333', name: 'Grand Arena Lagos', category: 'VENUE' as const, area: 'Ikeja' },
    { phone: '+2348044444444', name: 'Glow Beauty', category: 'MAKEUP_ARTIST' as const, area: 'Surulere' },
    { phone: '+2348055555555', name: 'DJ Maestro', category: 'DJ' as const, area: 'Yaba' },
  ];

  for (const v of vendorUsers) {
    const user = await prisma.user.upsert({
      where: { phone: v.phone },
      update: {},
      create: {
        phone: v.phone,
        role: 'VENDOR',
        authIdentities: {
          create: { provider: 'PHONE', providerId: v.phone },
        },
      },
    });

    await prisma.vendor.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        slug: v.name.toLowerCase().replace(/\s+/g, '-'),
        businessName: v.name,
        category: v.category,
        description: `${v.name} provides top-quality ${v.category.toLowerCase()} services in ${v.area}, Lagos. Trusted by over 100 clients.`,
        area: v.area,
        status: 'ACTIVE',
        avgRating: 4.0 + Math.random(),
        reviewCount: Math.floor(Math.random() * 20) + 5,
        profileCompleteScore: 0.7 + Math.random() * 0.3,
      },
    });

    console.log(`Vendor created: ${v.name}`);
  }

  // Create test clients
  const clientPhones = ['+2348066666666', '+2348077777777', '+2348088888888'];
  for (const phone of clientPhones) {
    const client = await prisma.user.upsert({
      where: { phone },
      update: {},
      create: {
        phone,
        role: 'CLIENT',
        authIdentities: {
          create: { provider: 'PHONE', providerId: phone },
        },
      },
    });
    console.log(`Client created: ${client.id}`);
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
