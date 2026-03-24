import type { Metadata } from 'next';
import { Mail, MessageCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact EventTrust Nigeria',
  description:
    'Get in touch with the EventTrust Nigeria team for support, vendor enquiries, or general questions.',
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold text-surface-900">Contact Us</h1>
      <p className="mb-10 text-surface-600">
        We&apos;re here to help. Reach us through any of the channels below.
      </p>

      <div className="space-y-6">
        <div className="rounded-xl border border-surface-200 p-6">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
              <Mail className="h-5 w-5 text-primary-600" />
            </div>
            <h2 className="text-lg font-semibold text-surface-900">Email Support</h2>
          </div>
          <p className="mb-3 text-sm text-surface-600">
            For general enquiries, vendor applications, or account issues:
          </p>
          <a
            href="mailto:support@eventtrust.com.ng"
            className="text-primary-600 font-medium hover:text-primary-700 transition-colors"
          >
            support@eventtrust.com.ng
          </a>
          <p className="mt-2 text-xs text-surface-500">We aim to respond within 24 hours on business days.</p>
        </div>

        <div className="rounded-xl border border-surface-200 p-6">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
              <MessageCircle className="h-5 w-5 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-surface-900">WhatsApp</h2>
          </div>
          <p className="mb-3 text-sm text-surface-600">
            For urgent vendor support or partnership enquiries, message us on WhatsApp:
          </p>
          <a
            href="https://wa.me/2348000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-700 font-medium hover:text-green-800 transition-colors"
          >
            +234 800 000 0000
          </a>
          <p className="mt-2 text-xs text-surface-500">Available Monday – Friday, 9am – 6pm (WAT).</p>
        </div>

        <div className="rounded-xl border border-surface-200 p-6">
          <h2 className="mb-2 text-lg font-semibold text-surface-900">Vendor Applications</h2>
          <p className="mb-4 text-sm text-surface-600">
            Ready to list your services on EventTrust? Create your vendor profile directly from the
            platform — no need to email us first.
          </p>
          <a
            href="/vendor/signup"
            className="inline-flex h-11 items-center rounded-md bg-primary-600 px-6 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
          >
            Start Vendor Application
          </a>
        </div>
      </div>
    </div>
  );
}
