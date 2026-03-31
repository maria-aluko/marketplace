import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Transparency Report — EventTrust Nigeria',
  description:
    'Monthly statistics on vendor approvals, reviews, and dispute resolution on the EventTrust platform.',
};

interface StatRowProps {
  label: string;
  value: string | number;
  note?: string;
}

function StatRow({ label, value, note }: StatRowProps) {
  return (
    <div className="flex items-start justify-between border-b border-surface-100 py-3 last:border-0">
      <div>
        <p className="text-sm font-medium text-surface-800">{label}</p>
        {note && <p className="text-xs text-surface-500">{note}</p>}
      </div>
      <p className="text-sm font-bold text-surface-900">{value}</p>
    </div>
  );
}

export default function TransparencyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold text-surface-900">Transparency Report</h1>
      <p className="mb-2 text-sm text-surface-500">
        Published monthly. Last updated: March 2026.
      </p>
      <p className="mb-8 text-sm text-surface-600">
        We believe trust is built through honesty. This report shares how our platform is growing
        and how we handle moderation, reviews, and disputes. Statistics are manually updated each
        month; live data will be available in a future release.
      </p>

      <div className="space-y-8">
        {/* Vendors */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-surface-800">Vendors</h2>
          <div className="rounded-lg border border-surface-200 bg-white px-4">
            <StatRow label="Total registered vendors" value={47} />
            <StatRow
              label="Active (approved) vendors"
              value={31}
              note="Vendors whose profiles are live and searchable"
            />
            <StatRow
              label="Pending approval"
              value={9}
              note="Applications currently under review by our team"
            />
            <StatRow
              label="Suspended vendors"
              value={2}
              note="Accounts suspended for policy violations"
            />
            <StatRow
              label="Average approval time"
              value="1.8 days"
              note="From submission to first decision"
            />
          </div>
        </section>

        {/* Reviews */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-surface-800">Reviews</h2>
          <div className="rounded-lg border border-surface-200 bg-white px-4">
            <StatRow label="Total reviews submitted" value={184} />
            <StatRow label="Reviews approved" value={162} />
            <StatRow
              label="Reviews rejected"
              value={14}
              note="Removed for violating review guidelines (fake, abusive, or off-topic content)"
            />
            <StatRow
              label="Reviews pending moderation"
              value={8}
              note="Awaiting admin review"
            />
            <StatRow label="Average rating across platform" value="4.3 / 5" />
          </div>
        </section>

        {/* Disputes */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-surface-800">Disputes</h2>
          <div className="rounded-lg border border-surface-200 bg-white px-4">
            <StatRow
              label="Total disputes raised"
              value={11}
              note="Vendors disputing client reviews"
            />
            <StatRow label="Disputes decided" value={8} />
            <StatRow
              label="Reviews removed after dispute"
              value={3}
              note="Decisions where the review was found to violate policy"
            />
            <StatRow
              label="Disputes appealed by vendors"
              value={2}
              note="Vendors who contested our initial decision"
            />
            <StatRow label="Open disputes" value={3} note="Awaiting admin decision" />
          </div>
        </section>

        {/* Clients */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-surface-800">Clients</h2>
          <div className="rounded-lg border border-surface-200 bg-white px-4">
            <StatRow label="Total registered clients" value={312} />
            <StatRow
              label="Clients who submitted at least one review"
              value={97}
            />
          </div>
        </section>

        {/* Methodology */}
        <section className="rounded-lg border border-surface-200 bg-surface-50 p-4">
          <h2 className="mb-2 text-base font-semibold text-surface-800">Methodology</h2>
          <p className="text-sm text-surface-600">
            All figures are manually compiled from platform data at the start of each month.
            &quot;Active vendor&quot; means a vendor whose account status is{' '}
            <span className="font-mono text-xs">ACTIVE</span> at the time of reporting.
            Dispute outcomes are decided by the EventTrust moderation team based on our{' '}
            <a href="/terms" className="text-primary-600 hover:underline">
              Terms of Service
            </a>
            . We do not share individual user data in this report.
          </p>
        </section>
      </div>
    </main>
  );
}
