import { describe, it, expect } from 'vitest';
import {
  phoneSchema,
  otpRequestSchema,
  otpVerifySchema,
  createVendorSchema,
  createReviewSchema,
  vendorStatusTransitionSchema,
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
  it('accepts valid review', () => {
    const result = createReviewSchema.safeParse({
      vendorId: '550e8400-e29b-41d4-a716-446655440000',
      rating: 5,
      body: 'This vendor provided excellent service. Would definitely recommend to anyone looking for quality catering.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects review body under 50 chars', () => {
    const result = createReviewSchema.safeParse({
      vendorId: '550e8400-e29b-41d4-a716-446655440000',
      rating: 5,
      body: 'Too short',
    });
    expect(result.success).toBe(false);
  });

  it('rejects rating outside 1-5', () => {
    const result = createReviewSchema.safeParse({
      vendorId: '550e8400-e29b-41d4-a716-446655440000',
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
