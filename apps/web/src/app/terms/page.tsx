import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — EventTrust Nigeria',
  description: 'EventTrust Nigeria terms of service for vendors and clients.',
};

const LAST_UPDATED = 'March 2026';

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold text-surface-900">Terms of Service</h1>
      <p className="mb-10 text-sm text-surface-500">Last updated: {LAST_UPDATED}</p>

      <div className="space-y-8 text-surface-700">
        <section>
          <h2 className="mb-3 text-xl font-semibold text-surface-800">1. Overview</h2>
          <p>
            EventTrust Nigeria (&quot;we&quot;, &quot;our&quot;, &quot;the platform&quot;) provides a
            marketplace connecting event service providers (&quot;Vendors&quot;) with event planners
            and clients (&quot;Clients&quot;) in Lagos, Nigeria. By using EventTrust, you agree to
            these terms.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-surface-800">2. Vendor Obligations</h2>
          <ul className="space-y-2">
            <li>Vendors must provide accurate business information during registration.</li>
            <li>
              Vendors must respond to client enquiries in a professional and timely manner.
            </li>
            <li>
              Listing descriptions, photos, and pricing must accurately represent the service or
              equipment offered.
            </li>
            <li>
              Vendors are solely responsible for the quality and delivery of their services. EventTrust
              is not a party to any service agreement between a Vendor and Client.
            </li>
            <li>
              Vendors may not create duplicate listings for the same service with the intent to
              manipulate search rankings.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-surface-800">3. Client Obligations</h2>
          <ul className="space-y-2">
            <li>Clients must provide accurate contact information when submitting enquiries.</li>
            <li>
              Reviews submitted by Clients must be honest, based on direct personal experience, and
              comply with our review guidelines. False or defamatory reviews are prohibited.
            </li>
            <li>
              Clients must not use the platform to solicit vendors off-platform to avoid fees in
              future paid tiers.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-surface-800">4. Verification & Approval</h2>
          <p>
            All Vendors are subject to manual review before their profile becomes publicly visible.
            EventTrust reserves the right to reject, suspend, or remove any Vendor profile that does
            not meet our quality standards, without notice. Approval does not constitute endorsement
            of any individual vendor.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-surface-800">5. Reviews & Disputes</h2>
          <p className="mb-2">
            Clients may submit one review per vendor per calendar month. Vendors may submit one
            reply per review, editable within 48 hours of posting.
          </p>
          <p>
            Vendors may raise a dispute on a review within 72 hours of its approval. Disputes are
            reviewed by the EventTrust admin team. One appeal per dispute is permitted. EventTrust&apos;s
            decision on disputes is final.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-surface-800">6. Payments</h2>
          <p>
            EventTrust does not process payments between Vendors and Clients at this time. All
            financial transactions are conducted directly between Vendors and Clients. EventTrust is
            not liable for payment disputes, non-payment, or fraud arising from transactions
            conducted outside the platform.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-surface-800">7. Prohibited Content</h2>
          <p>
            You may not use EventTrust to list, promote, or facilitate services that are illegal
            under Nigerian law, harmful, deceptive, or otherwise violate our community standards.
            We reserve the right to remove any content and terminate any account in violation of
            this policy.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-surface-800">8. Limitation of Liability</h2>
          <p>
            EventTrust Nigeria is a marketplace platform and is not liable for the quality,
            safety, legality, or delivery of any vendor&apos;s services or equipment. Our maximum
            liability to any party shall not exceed the fees (if any) paid by that party to
            EventTrust in the preceding 12 months.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-surface-800">9. Changes to Terms</h2>
          <p>
            We may update these terms from time to time. Continued use of EventTrust after changes
            are published constitutes acceptance of the revised terms. For material changes, we will
            notify registered users by email or SMS.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-surface-800">10. Contact</h2>
          <p>
            For questions about these terms, contact us at{' '}
            <a
              href="mailto:support@eventtrust.com.ng"
              className="text-primary-600 hover:text-primary-700"
            >
              support@eventtrust.com.ng
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
