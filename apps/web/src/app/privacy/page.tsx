import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — EventTrust Nigeria',
  description:
    'Learn how EventTrust Nigeria collects, uses, and protects your personal data when you use our platform.',
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold text-surface-900">Privacy Policy</h1>
      <p className="mb-8 text-sm text-surface-500">Last updated: March 2026</p>

      <div className="prose prose-sm max-w-none space-y-8 text-surface-700">
        <section>
          <h2 className="text-xl font-semibold text-surface-800">1. Who We Are</h2>
          <p className="mt-2">
            EventTrust Nigeria operates the EventTrust platform at{' '}
            <span className="font-medium">eventtrust.com.ng</span> — a verified marketplace
            connecting clients with trusted event vendors across Lagos. We are committed to
            protecting your privacy and handling your data responsibly.
          </p>
          <p className="mt-2">
            For privacy enquiries, contact us at{' '}
            <a href="mailto:privacy@eventtrust.com.ng" className="text-primary-600 hover:underline">
              privacy@eventtrust.com.ng
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-surface-800">2. Data We Collect</h2>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>
              <span className="font-medium">Phone number</span> — collected during registration
              for identity verification via one-time password (OTP).
            </li>
            <li>
              <span className="font-medium">Business information</span> — for vendors: business
              name, description, category, service area, WhatsApp number, Instagram handle, and
              pricing.
            </li>
            <li>
              <span className="font-medium">Media files</span> — portfolio images and videos
              uploaded by vendors, processed via Cloudinary.
            </li>
            <li>
              <span className="font-medium">Reviews and disputes</span> — text and evidence files
              submitted through the platform.
            </li>
            <li>
              <span className="font-medium">Usage data</span> — pages visited, actions taken,
              errors encountered (collected via Sentry for error monitoring).
            </li>
            <li>
              <span className="font-medium">Inquiry records</span> — when you contact a vendor
              through EventTrust, we log the inquiry channel and timestamp.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-surface-800">3. How We Use Your Data</h2>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>To verify your identity and secure your account via OTP authentication.</li>
            <li>To display vendor profiles and listings to potential clients.</li>
            <li>To send transactional SMS notifications (OTP codes, status updates) via Termii.</li>
            <li>To send email notifications (invoices, confirmations) via Resend.</li>
            <li>To process and store media uploads securely via Cloudinary.</li>
            <li>To moderate the platform — review approvals, dispute resolution, vendor status.</li>
            <li>To improve platform reliability and performance using aggregated, anonymised data.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-surface-800">4. Third-Party Services</h2>
          <p className="mt-2">We use the following third-party services to operate the platform:</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>
              <span className="font-medium">Supabase</span> — managed PostgreSQL database hosting
              (data stored in EU region).
            </li>
            <li>
              <span className="font-medium">Cloudinary</span> — media storage and delivery for
              portfolio images and videos.
            </li>
            <li>
              <span className="font-medium">Termii</span> — SMS delivery for OTP verification
              and notifications (Nigeria-based).
            </li>
            <li>
              <span className="font-medium">Resend</span> — transactional email delivery.
            </li>
            <li>
              <span className="font-medium">Sentry</span> — application error monitoring.
            </li>
            <li>
              <span className="font-medium">Railway / Vercel</span> — application hosting for
              the API and frontend respectively.
            </li>
          </ul>
          <p className="mt-2">
            Each of these services has its own privacy policy. We choose providers that meet
            reasonable data protection standards and process your data only as necessary to
            provide our services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-surface-800">5. Data Retention</h2>
          <p className="mt-2">
            We retain your data for as long as your account is active. If you delete your account,
            we anonymise your personal data within 30 days, except where we are required to retain
            it for legal or compliance reasons (e.g. transaction records, audit logs).
          </p>
          <p className="mt-2">
            Media files stored on Cloudinary are deleted when you remove them from the platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-surface-800">6. Your Rights</h2>
          <p className="mt-2">You have the right to:</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Access the personal data we hold about you.</li>
            <li>Request correction of inaccurate data.</li>
            <li>Request deletion of your account and associated data.</li>
            <li>Object to processing of your data for certain purposes.</li>
          </ul>
          <p className="mt-2">
            To exercise any of these rights, email{' '}
            <a href="mailto:privacy@eventtrust.com.ng" className="text-primary-600 hover:underline">
              privacy@eventtrust.com.ng
            </a>
            . We will respond within 14 days.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-surface-800">7. Cookies and Local Storage</h2>
          <p className="mt-2">
            EventTrust uses HTTP-only cookies for session management (access and refresh tokens).
            These are essential for the platform to function and cannot be opted out of while
            using the service. We do not use advertising cookies or third-party tracking pixels.
          </p>
          <p className="mt-2">
            We use <span className="font-medium">localStorage</span> only to store
            non-sensitive preferences (e.g. PWA install prompt dismissal state).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-surface-800">8. Children's Privacy</h2>
          <p className="mt-2">
            EventTrust is not intended for users under the age of 18. We do not knowingly collect
            personal data from children. If you believe a child has created an account, please
            contact us immediately.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-surface-800">9. Changes to This Policy</h2>
          <p className="mt-2">
            We may update this policy from time to time. When we make material changes, we will
            notify registered users via SMS or in-app notification. Continued use of the platform
            after the update constitutes acceptance of the new policy.
          </p>
        </section>
      </div>
    </main>
  );
}
