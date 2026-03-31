'use client';

import { useEffect } from 'react';
import type { InvoiceResponse } from '@eventtrust/shared';

function AutoPrint() {
  useEffect(() => {
    window.print();
  }, []);
  return null;
}

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-NG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

interface InvoicePrintTemplateProps {
  invoice: InvoiceResponse;
  vendorName?: string;
  autoPrint?: boolean;
}

export function InvoicePrintTemplate({
  invoice,
  vendorName,
  autoPrint = true,
}: InvoicePrintTemplateProps) {
  const accentColor = invoice.branding?.accentColor ?? '#16a34a';

  return (
    <>
      {autoPrint && <AutoPrint />}
      <div className="min-h-screen bg-white">
        {/* Accent bar */}
        <div className="h-2 w-full" style={{ backgroundColor: accentColor }} />

        <div className="mx-auto max-w-[680px] px-8 py-10 space-y-8">
          {/* Header: logo + company + tagline */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              {invoice.branding?.logoUrl && (
                <img
                  src={invoice.branding.logoUrl}
                  alt="Vendor logo"
                  className="mb-2 h-10 object-contain"
                />
              )}
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                EventTrust Nigeria
              </p>
              {invoice.branding?.tagline && (
                <p className="text-sm italic text-gray-500">{invoice.branding.tagline}</p>
              )}
            </div>
            <div className="text-right space-y-1">
              <p className="text-2xl font-bold text-gray-900">INVOICE</p>
              <p className="text-sm text-gray-500">{invoice.invoiceNumber}</p>
              <span
                className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: `${accentColor}20`,
                  color: accentColor,
                }}
              >
                {invoice.status}
              </span>
            </div>
          </div>

          {/* From / To */}
          <div className="grid grid-cols-2 gap-6">
            {vendorName && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  From
                </p>
                <p className="text-sm font-semibold text-gray-900">{vendorName}</p>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                To
              </p>
              <p className="text-sm font-semibold text-gray-900">{invoice.clientName}</p>
              {invoice.clientPhone && (
                <p className="text-sm text-gray-500">{invoice.clientPhone}</p>
              )}
              {invoice.clientEmail && (
                <p className="text-sm text-gray-500">{invoice.clientEmail}</p>
              )}
            </div>
          </div>

          {/* Event details */}
          {(invoice.eventDate || invoice.dueDate || invoice.eventLocation) && (
            <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 space-y-1.5">
              {invoice.eventDate && (
                <div className="flex items-baseline gap-3 text-sm">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 w-20 shrink-0">
                    Event Date
                  </span>
                  <span className="text-gray-700">{formatDate(invoice.eventDate)}</span>
                </div>
              )}
              {invoice.dueDate && (
                <div className="flex items-baseline gap-3 text-sm">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 w-20 shrink-0">
                    Due
                  </span>
                  <span className="text-gray-700">{formatDate(invoice.dueDate)}</span>
                </div>
              )}
              {invoice.eventLocation && (
                <div className="flex items-baseline gap-3 text-sm">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 w-20 shrink-0">
                    Location
                  </span>
                  <span className="text-gray-700">{invoice.eventLocation}</span>
                </div>
              )}
            </div>
          )}

          {/* Line items */}
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: accentColor }}>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-white">
                    Item
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-white">
                    Qty
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-white">
                    Unit Price
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-white">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoice.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-gray-700">{item.description}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {formatNaira(item.unitPriceKobo)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-800">
                      {formatNaira(item.totalKobo)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                {invoice.discountKobo > 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-2 text-right text-sm text-gray-500"
                    >
                      Subtotal
                    </td>
                    <td className="px-4 py-2 text-right text-sm text-gray-700">
                      {formatNaira(invoice.subtotalKobo)}
                    </td>
                  </tr>
                )}
                {invoice.discountKobo > 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-2 text-right text-sm text-gray-500"
                    >
                      Discount
                    </td>
                    <td className="px-4 py-2 text-right text-sm text-green-600">
                      -{formatNaira(invoice.discountKobo)}
                    </td>
                  </tr>
                )}
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-3 text-right font-semibold text-gray-900"
                  >
                    Total
                  </td>
                  <td className="px-4 py-3 text-right text-base font-bold text-gray-900">
                    {formatNaira(invoice.totalKobo)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Notes
              </p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}

          {/* Branding footer text */}
          {invoice.branding?.footerText && (
            <p className="text-center text-xs text-gray-400">{invoice.branding.footerText}</p>
          )}

          {/* Powered by */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-center text-[10px] text-gray-300">
              Powered by EventTrust Nigeria · eventtrust.com.ng
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
