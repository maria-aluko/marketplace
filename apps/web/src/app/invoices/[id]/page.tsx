import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { serverFetch } from '@/lib/server-api';
import { InvoiceView } from '@/components/invoices/invoice-view';
import type { InvoiceResponse, VendorResponse } from '@eventtrust/shared';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const invoice = await serverFetch<InvoiceResponse>(`/invoices/${id}`, { revalidate: 0 });

  if (!invoice) {
    return { title: 'Invoice Not Found — EventTrust' };
  }

  const total = `₦${(invoice.totalKobo / 100).toLocaleString('en-NG')}`;

  return {
    title: `Invoice ${invoice.invoiceNumber} — EventTrust Nigeria`,
    description: `Invoice for ${invoice.clientName} · ${total}${invoice.eventDate ? ` · ${invoice.eventDate}` : ''}`,
    openGraph: {
      title: `Invoice ${invoice.invoiceNumber} — EventTrust Nigeria`,
      description: `Quote for ${invoice.clientName} · Total: ${total}`,
    },
  };
}

export default async function InvoicePage({ params }: Props) {
  const { id } = await params;

  const invoice = await serverFetch<InvoiceResponse>(`/invoices/${id}`, { revalidate: 0 });
  if (!invoice) notFound();

  const vendor = await serverFetch<VendorResponse>(`/vendors/${invoice.vendorId}`, {
    revalidate: 300,
  });

  return <InvoiceView invoice={invoice} vendorName={vendor?.businessName} />;
}
