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

  // Create sample listings for the first two vendors
  const vendors = await prisma.vendor.findMany({ where: { status: 'ACTIVE' }, take: 3 });

  if (vendors.length > 0) {
    // Service listing for first vendor
    await prisma.listing.upsert({
      where: { id: '00000000-0000-0000-0000-000000000001' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000001',
        vendorId: vendors[0].id,
        listingType: 'SERVICE',
        title: 'Full-Service Event Catering',
        description: 'Complete catering packages for weddings, birthdays, and corporate events. Includes setup and cleanup.',
        category: vendors[0].category,
        priceFrom: 150000,
        priceTo: 500000,
        photos: [],
      },
    });
    console.log('Service listing created for:', vendors[0].businessName);
  }

  if (vendors.length > 1) {
    // Another service listing
    await prisma.listing.upsert({
      where: { id: '00000000-0000-0000-0000-000000000002' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000002',
        vendorId: vendors[1].id,
        listingType: 'SERVICE',
        title: 'Professional Event Photography',
        description: 'High-quality event photography with same-day delivery of edited highlights.',
        category: vendors[1].category,
        priceFrom: 80000,
        priceTo: 300000,
        photos: [],
      },
    });
    console.log('Service listing created for:', vendors[1].businessName);
  }

  if (vendors.length > 2) {
    // Rental listing with details
    const rentalListing = await prisma.listing.upsert({
      where: { id: '00000000-0000-0000-0000-000000000003' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000003',
        vendorId: vendors[2].id,
        listingType: 'RENTAL',
        title: 'Marquee Tent Rental — 500 Capacity',
        description: 'Premium waterproof marquee tents for large outdoor events. Delivery and setup included.',
        photos: [],
      },
    });

    await prisma.listingRentalDetails.upsert({
      where: { listingId: rentalListing.id },
      update: {},
      create: {
        listingId: rentalListing.id,
        rentalCategory: 'TENT',
        quantityAvailable: 5,
        pricePerDay: 75000,
        depositAmount: 25000,
        deliveryOption: 'BOTH',
        condition: 'Excellent — less than 6 months old',
      },
    });
    console.log('Rental listing created for:', vendors[2].businessName);
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
