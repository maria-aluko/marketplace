import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { serverFetch } from '@/lib/server-api';
import { InvoicePrintTemplate } from '@/components/invoices/invoice-print-template';
import type { InvoiceResponse, VendorResponse } from '@eventtrust/shared';

export const metadata: Metadata = {
  title: 'Invoice — EventTrust Nigeria',
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ noprint?: string }>;
}

export default async function InvoicePrintPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { noprint } = await searchParams;

  const invoice = await serverFetch<InvoiceResponse>(`/invoices/${id}`, { revalidate: 0 });
  if (!invoice) notFound();

  const vendor = await serverFetch<VendorResponse>(`/vendors/${invoice.vendorId}`, {
    revalidate: 300,
  });

  return (
    <InvoicePrintTemplate
      invoice={invoice}
      vendorName={vendor?.businessName}
      autoPrint={!noprint}
    />
  );
}
