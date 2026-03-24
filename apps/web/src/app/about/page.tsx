import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About EventTrust Nigeria',
  description:
    'EventTrust Nigeria connects Lagos event planners with verified, trustworthy caterers, photographers, venues, and equipment rental vendors.',
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold text-surface-900">About EventTrust Nigeria</h1>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold text-surface-800">Our Mission</h2>
        <p className="text-surface-700">
          EventTrust Nigeria exists to make finding and hiring trusted event service providers
          simple, safe, and transparent for every Lagos family, couple, and business. We verify
          every vendor on our platform so you can focus on your event — not on wondering whether a
          vendor will show up.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold text-surface-800">Why EventTrust?</h2>
        <p className="mb-4 text-surface-700">
          Planning an event in Lagos is exciting — but it comes with real risks. Unverified vendors,
          last-minute cancellations, and pricing surprises are common frustrations. EventTrust
          solves this by building a curated marketplace where every vendor is reviewed and approved
          by our team before going live.
        </p>
        <ul className="space-y-2 text-surface-700">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-primary-600">✓</span>
            <span>All vendors are manually verified before appearing in search results</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-primary-600">✓</span>
            <span>Real reviews from real clients — vendors cannot remove or edit them</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-primary-600">✓</span>
            <span>Direct WhatsApp contact — no middlemen, no hidden fees</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-primary-600">✓</span>
            <span>Services and equipment rentals — all in one place</span>
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold text-surface-800">What We Cover</h2>
        <p className="text-surface-700">
          From caterers and photographers to venue managers, MC/entertainers, decorators, and
          equipment rental vendors (tents, chairs, generators, lighting), EventTrust covers
          everything you need for events across Lagos.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold text-surface-800">Are You a Vendor?</h2>
        <p className="mb-4 text-surface-700">
          Join hundreds of event service providers already growing their businesses on EventTrust.
          Create a free profile, list your services and rental equipment, and get discovered by
          thousands of potential clients in Lagos.
        </p>
        <a
          href="/vendor/signup"
          className="inline-flex h-11 items-center rounded-md bg-primary-600 px-6 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
        >
          Create Vendor Profile — Free
        </a>
      </section>
    </div>
  );
}
