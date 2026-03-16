'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import type { InvoiceResponse, CreateInvoicePayload, CreateInvoiceItemPayload } from '@eventtrust/shared';

interface InvoiceGeneratorProps {
  vendorId: string;
  onCreated?: (invoice: InvoiceResponse) => void;
  onCancel?: () => void;
}

interface ItemForm extends CreateInvoiceItemPayload {
  _key: number;
}

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`;
}

export function InvoiceGenerator({ vendorId, onCreated, onCancel }: InvoiceGeneratorProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: client info
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [notes, setNotes] = useState('');

  // Step 2: line items
  const [items, setItems] = useState<ItemForm[]>([
    { _key: 1, description: '', quantity: 1, unitPriceKobo: 0, sortOrder: 0 },
  ]);
  const [discountKobo, setDiscountKobo] = useState(0);

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPriceKobo, 0);
  const total = Math.max(0, subtotal - discountKobo);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { _key: Date.now(), description: '', quantity: 1, unitPriceKobo: 0, sortOrder: prev.length },
    ]);
  };

  const removeItem = (key: number) => {
    setItems((prev) => prev.filter((i) => i._key !== key));
  };

  const updateItem = (key: number, field: keyof Omit<ItemForm, '_key'>, value: string | number) => {
    setItems((prev) =>
      prev.map((i) => (i._key === key ? { ...i, [field]: value } : i)),
    );
  };

  const handleCreate = async () => {
    setSubmitting(true);
    setError(null);

    const payload: CreateInvoicePayload = {
      clientName,
      clientPhone: clientPhone || undefined,
      clientEmail: clientEmail || undefined,
      eventDate: eventDate || undefined,
      eventLocation: eventLocation || undefined,
      notes: notes || undefined,
      discountKobo,
      items: items.map(({ _key, ...rest }) => rest),
    };

    const res = await apiClient.post<{ data: InvoiceResponse }>('/invoices', payload);
    setSubmitting(false);

    if (!res.success || !res.data) {
      setError(res.error ?? 'Failed to create invoice');
      return;
    }

    onCreated?.(res.data.data);
  };

  const handleSend = async (invoiceId: string) => {
    setSubmitting(true);
    await apiClient.post(`/invoices/${invoiceId}/send`);
    setSubmitting(false);
  };

  if (step === 1) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-surface-900">Client Details</h3>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-surface-700">Client Name *</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Ngozi Okonkwo"
              className="mt-1 w-full rounded-md border border-surface-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-surface-700">WhatsApp Number</label>
            <input
              type="tel"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="+2348012345678"
              className="mt-1 w-full rounded-md border border-surface-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-surface-700">Email (optional)</label>
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="client@email.com"
              className="mt-1 w-full rounded-md border border-surface-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-surface-700">Event Date</label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="mt-1 w-full rounded-md border border-surface-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-surface-700">Event Location</label>
            <input
              type="text"
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
              placeholder="e.g. Eko Hotels, Victoria Island"
              className="mt-1 w-full rounded-md border border-surface-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-surface-700">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any extra terms or notes..."
              className="mt-1 w-full rounded-md border border-surface-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex gap-2">
          {onCancel && (
            <Button variant="outline" className="flex-1" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            className="flex-1"
            disabled={!clientName.trim()}
            onClick={() => setStep(2)}
          >
            Next: Add Items
          </Button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-surface-900">Line Items</h3>

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item._key} className="rounded-lg border border-surface-200 p-3 space-y-2">
              <input
                type="text"
                value={item.description}
                onChange={(e) => updateItem(item._key, 'description', e.target.value)}
                placeholder="Description (e.g. Photography package)"
                className="w-full rounded-md border border-surface-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-surface-500">Qty</label>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(item._key, 'quantity', Number(e.target.value))}
                    className="mt-0.5 w-full rounded-md border border-surface-300 px-2 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div className="flex-[2]">
                  <label className="text-xs text-surface-500">Unit Price (₦)</label>
                  <input
                    type="number"
                    min={0}
                    value={item.unitPriceKobo / 100}
                    onChange={(e) =>
                      updateItem(item._key, 'unitPriceKobo', Math.round(Number(e.target.value) * 100))
                    }
                    className="mt-0.5 w-full rounded-md border border-surface-300 px-2 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div className="flex-1 flex flex-col">
                  <label className="text-xs text-surface-500">Total</label>
                  <span className="mt-0.5 py-1.5 text-sm font-medium text-surface-700">
                    {formatNaira(item.quantity * item.unitPriceKobo)}
                  </span>
                </div>
                {items.length > 1 && (
                  <button
                    onClick={() => removeItem(item._key)}
                    className="mt-4 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}

          <Button variant="outline" size="sm" onClick={addItem} className="w-full">
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>

          <div>
            <label className="text-sm font-medium text-surface-700">Discount (₦)</label>
            <input
              type="number"
              min={0}
              value={discountKobo / 100}
              onChange={(e) => setDiscountKobo(Math.round(Number(e.target.value) * 100))}
              className="mt-1 w-full rounded-md border border-surface-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div className="rounded-lg bg-surface-50 p-3 text-sm space-y-1">
            <div className="flex justify-between text-surface-600">
              <span>Subtotal</span>
              <span>{formatNaira(subtotal)}</span>
            </div>
            {discountKobo > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-{formatNaira(discountKobo)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-surface-900 border-t border-surface-200 pt-1 mt-1">
              <span>Total</span>
              <span>{formatNaira(total)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
            Back
          </Button>
          <Button
            className="flex-1"
            disabled={items.some((i) => !i.description.trim()) || items.length === 0}
            onClick={() => setStep(3)}
          >
            Preview
          </Button>
        </div>
      </div>
    );
  }

  // Step 3: preview + send
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-surface-900">Preview & Send</h3>

      <div className="rounded-lg border border-surface-200 p-4 space-y-3 text-sm">
        <div>
          <p className="font-medium">{clientName}</p>
          {clientPhone && <p className="text-surface-500">{clientPhone}</p>}
          {eventDate && <p className="text-surface-500">Event: {eventDate}</p>}
          {eventLocation && <p className="text-surface-500">{eventLocation}</p>}
        </div>

        <div className="space-y-1 border-t border-surface-100 pt-3">
          {items.map((item, idx) => (
            <div key={idx} className="flex justify-between">
              <span className="text-surface-600">
                {item.description} × {item.quantity}
              </span>
              <span>{formatNaira(item.quantity * item.unitPriceKobo)}</span>
            </div>
          ))}
          {discountKobo > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-{formatNaira(discountKobo)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold border-t border-surface-200 pt-1 mt-1">
            <span>Total</span>
            <span>{formatNaira(total)}</span>
          </div>
        </div>

        {notes && <p className="text-surface-500 text-xs border-t border-surface-100 pt-2">{notes}</p>}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => setStep(2)} disabled={submitting}>
          Back
        </Button>
        <Button
          className="flex-1"
          disabled={submitting}
          onClick={async () => {
            await handleCreate();
          }}
        >
          {submitting ? 'Creating...' : 'Create Invoice'}
        </Button>
      </div>
    </div>
  );
}
