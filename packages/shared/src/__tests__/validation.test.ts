import { describe, it, expect } from 'vitest';
import {
  phoneSchema,
  otpRequestSchema,
  otpVerifySchema,
  createVendorSchema,
  createReviewSchema,
  vendorStatusTransitionSchema,
  createServiceListingSchema,
  updateServiceListingSchema,
  createRentalListingSchema,
  updateRentalListingSchema,
} from '../validation';

describe('phoneSchema', () => {
  it('accepts valid Nigerian E.164 phone', () => {
    expect(phoneSchema.safeParse('+2348012345678').success).toBe(true);
  });

  it('rejects phone without country code', () => {
    expect(phoneSchema.safeParse('08012345678').success).toBe(false);
  });

  it('rejects phone with wrong country code', () => {
    expect(phoneSchema.safeParse('+1234567890').success).toBe(false);
  });

  it('rejects phone with wrong length', () => {
    expect(phoneSchema.safeParse('+23480123456').success).toBe(false);
  });
});

describe('otpRequestSchema', () => {
  it('accepts valid payload', () => {
    expect(otpRequestSchema.safeParse({ phone: '+2348012345678' }).success).toBe(true);
  });

  it('rejects missing phone', () => {
    expect(otpRequestSchema.safeParse({}).success).toBe(false);
  });
});

describe('otpVerifySchema', () => {
  it('accepts valid payload', () => {
    const result = otpVerifySchema.safeParse({
      phone: '+2348012345678',
      code: '123456',
    });
    expect(result.success).toBe(true);
  });

  it('rejects wrong OTP length', () => {
    const result = otpVerifySchema.safeParse({
      phone: '+2348012345678',
      code: '12345',
    });
    expect(result.success).toBe(false);
  });
});

describe('createVendorSchema', () => {
  const validVendor = {
    businessName: 'Lagos Catering Co',
    category: 'caterer',
    description: 'We provide the best catering services in Lagos with 10+ years experience.',
    area: 'Lekki',
  };

  it('accepts valid vendor', () => {
    expect(createVendorSchema.safeParse(validVendor).success).toBe(true);
  });

  it('rejects invalid area', () => {
    expect(
      createVendorSchema.safeParse({ ...validVendor, area: 'Abuja' }).success,
    ).toBe(false);
  });

  it('rejects priceFrom > priceTo', () => {
    expect(
      createVendorSchema.safeParse({ ...validVendor, priceFrom: 500, priceTo: 100 }).success,
    ).toBe(false);
  });

  it('accepts valid price range', () => {
    expect(
      createVendorSchema.safeParse({ ...validVendor, priceFrom: 100, priceTo: 500 }).success,
    ).toBe(true);
  });
});

describe('createReviewSchema', () => {
  const INVOICE_ID = '660e8400-e29b-41d4-a716-446655440001';

  it('accepts valid review with invoiceId', () => {
    const result = createReviewSchema.safeParse({
      vendorId: '550e8400-e29b-41d4-a716-446655440000',
      invoiceId: INVOICE_ID,
      rating: 5,
      body: 'This vendor provided excellent service. Would definitely recommend to anyone looking for quality catering.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects review missing invoiceId', () => {
    const result = createReviewSchema.safeParse({
      vendorId: '550e8400-e29b-41d4-a716-446655440000',
      rating: 5,
      body: 'This vendor provided excellent service. Would definitely recommend to anyone looking for quality catering.',
    });
    expect(result.success).toBe(false);
  });

  it('rejects review body under 50 chars', () => {
    const result = createReviewSchema.safeParse({
      vendorId: '550e8400-e29b-41d4-a716-446655440000',
      invoiceId: INVOICE_ID,
      rating: 5,
      body: 'Too short',
    });
    expect(result.success).toBe(false);
  });

  it('rejects rating outside 1-5', () => {
    const result = createReviewSchema.safeParse({
      vendorId: '550e8400-e29b-41d4-a716-446655440000',
      invoiceId: INVOICE_ID,
      rating: 6,
      body: 'This is a long enough review body that should pass the minimum character requirement.',
    });
    expect(result.success).toBe(false);
  });
});

describe('vendorStatusTransitionSchema', () => {
  it('accepts valid transition payload', () => {
    const result = vendorStatusTransitionSchema.safeParse({
      vendorId: '550e8400-e29b-41d4-a716-446655440000',
      newStatus: 'pending',
      reason: 'Ready for review',
    });
    expect(result.success).toBe(true);
  });

  it('accepts without optional reason', () => {
    const result = vendorStatusTransitionSchema.safeParse({
      vendorId: '550e8400-e29b-41d4-a716-446655440000',
      newStatus: 'active',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid vendorId', () => {
    const result = vendorStatusTransitionSchema.safeParse({
      vendorId: 'not-a-uuid',
      newStatus: 'pending',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid status', () => {
    const result = vendorStatusTransitionSchema.safeParse({
      vendorId: '550e8400-e29b-41d4-a716-446655440000',
      newStatus: 'invalid_status',
    });
    expect(result.success).toBe(false);
  });
});

describe('createServiceListingSchema', () => {
  const validServiceListing = {
    title: 'Premium Catering Service',
    description: 'We offer full-service catering for weddings, birthdays, and corporate events.',
    category: 'caterer',
  };

  it('accepts valid service listing', () => {
    expect(createServiceListingSchema.safeParse(validServiceListing).success).toBe(true);
  });

  it('accepts with optional price range and photos', () => {
    expect(createServiceListingSchema.safeParse({
      ...validServiceListing,
      priceFrom: 50000,
      priceTo: 200000,
      photos: ['img_abc123'],
    }).success).toBe(true);
  });

  it('rejects title too short', () => {
    expect(createServiceListingSchema.safeParse({
      ...validServiceListing,
      title: 'Hi',
    }).success).toBe(false);
  });

  it('rejects description too short', () => {
    expect(createServiceListingSchema.safeParse({
      ...validServiceListing,
      description: 'Too short',
    }).success).toBe(false);
  });

  it('rejects priceFrom > priceTo', () => {
    expect(createServiceListingSchema.safeParse({
      ...validServiceListing,
      priceFrom: 200000,
      priceTo: 50000,
    }).success).toBe(false);
  });

  it('rejects invalid category', () => {
    expect(createServiceListingSchema.safeParse({
      ...validServiceListing,
      category: 'invalid_cat',
    }).success).toBe(false);
  });
});

describe('updateServiceListingSchema', () => {
  it('accepts partial update', () => {
    expect(updateServiceListingSchema.safeParse({
      title: 'Updated Title Here',
    }).success).toBe(true);
  });

  it('accepts empty object', () => {
    expect(updateServiceListingSchema.safeParse({}).success).toBe(true);
  });
});

describe('createRentalListingSchema', () => {
  const validRentalListing = {
    title: 'Party Tent Rental',
    description: 'Large marquee tents available for all types of outdoor events.',
    rentalCategory: 'tent',
    quantityAvailable: 10,
    pricePerDay: 15000,
    deliveryOption: 'both',
  };

  it('accepts valid rental listing', () => {
    expect(createRentalListingSchema.safeParse(validRentalListing).success).toBe(true);
  });

  it('accepts with optional fields', () => {
    expect(createRentalListingSchema.safeParse({
      ...validRentalListing,
      depositAmount: 5000,
      condition: 'like_new',
      photos: ['img_tent1', 'img_tent2'],
    }).success).toBe(true);
  });

  it('rejects missing required fields', () => {
    expect(createRentalListingSchema.safeParse({
      title: 'Party Tent Rental',
      description: 'Large marquee tents available for all types of outdoor events.',
    }).success).toBe(false);
  });

  it('rejects zero quantity', () => {
    expect(createRentalListingSchema.safeParse({
      ...validRentalListing,
      quantityAvailable: 0,
    }).success).toBe(false);
  });

  it('rejects invalid rental category', () => {
    expect(createRentalListingSchema.safeParse({
      ...validRentalListing,
      rentalCategory: 'invalid',
    }).success).toBe(false);
  });

  it('rejects invalid delivery option', () => {
    expect(createRentalListingSchema.safeParse({
      ...validRentalListing,
      deliveryOption: 'invalid',
    }).success).toBe(false);
  });
});

describe('updateRentalListingSchema', () => {
  it('accepts partial update', () => {
    expect(updateRentalListingSchema.safeParse({
      quantityAvailable: 20,
      pricePerDay: 20000,
    }).success).toBe(true);
  });

  it('accepts empty object', () => {
    expect(updateRentalListingSchema.safeParse({}).success).toBe(true);
  });
});
