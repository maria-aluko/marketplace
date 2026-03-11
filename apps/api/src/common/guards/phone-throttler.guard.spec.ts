import { PhoneThrottlerGuard } from './phone-throttler.guard';

describe('PhoneThrottlerGuard', () => {
  it('should use phone from body as tracker', async () => {
    const guard = new (PhoneThrottlerGuard as any)();
    // Override parent's getTracker to test our implementation
    const tracker = await (guard as any).getTracker({
      body: { phone: '+2348012345678' },
      ip: '127.0.0.1',
    });
    expect(tracker).toBe('+2348012345678');
  });

  it('should fall back to IP when no phone in body', async () => {
    const guard = new (PhoneThrottlerGuard as any)();
    const tracker = await (guard as any).getTracker({
      body: {},
      ip: '192.168.1.1',
    });
    expect(tracker).toBe('192.168.1.1');
  });
});
