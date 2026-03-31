'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { VendorAvailabilityResponse } from '@eventtrust/shared';

interface AvailabilityCalendarProps {
  vendorId: string;
  readOnly?: boolean;
}

type DateStatus = 'available' | 'blocked' | 'booked';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function AvailabilityCalendar({ vendorId, readOnly = false }: AvailabilityCalendarProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailability = useCallback(async () => {
    setError(null);
    const from = toDateString(new Date(year, month, 1));
    const to = toDateString(new Date(year, month + 1, 0));
    const res = await apiClient.get<{ data: VendorAvailabilityResponse[] }>(
      `/vendors/${vendorId}/availability?from=${from}&to=${to}`,
    );
    if (res.success && res.data) {
      const blocked = new Set(
        (res.data as any).data.map((item: VendorAvailabilityResponse) =>
          item.date.slice(0, 10),
        ),
      );
      setBlockedDates(blocked as Set<string>);
    } else {
      setError('Failed to load availability');
    }
  }, [vendorId, year, month]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  const handleDateClick = async (dateStr: string) => {
    if (readOnly || actionLoading) return;
    const isBlocked = blockedDates.has(dateStr);
    setActionLoading(dateStr);
    setError(null);

    if (isBlocked) {
      // Unblock
      const res = await apiClient.delete(`/vendors/${vendorId}/availability/${dateStr}`);
      if (res.success) {
        setBlockedDates((prev) => {
          const next = new Set(prev);
          next.delete(dateStr);
          return next;
        });
      } else {
        setError('Failed to unblock date');
      }
    } else {
      // Block
      const res = await apiClient.post(`/vendors/${vendorId}/availability`, { date: dateStr });
      if (res.success) {
        setBlockedDates((prev) => new Set([...prev, dateStr]));
      } else {
        setError('Failed to block date');
      }
    }
    setActionLoading(null);
  };

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = toDateString(now);

  const cells: (string | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) =>
      toDateString(new Date(year, month, i + 1)),
    ),
  ];

  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  const getStatus = (dateStr: string): DateStatus => {
    if (blockedDates.has(dateStr)) return 'blocked';
    return 'available';
  };

  const isPast = (dateStr: string) => dateStr < todayStr;

  return (
    <div className="space-y-3">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="rounded-lg border border-surface-200 p-1.5 hover:bg-surface-50 active:bg-surface-100"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4 text-surface-600" />
        </button>
        <p className="text-sm font-semibold text-surface-900">
          {MONTHS[month]} {year}
        </p>
        <button
          onClick={nextMonth}
          className="rounded-lg border border-surface-200 p-1.5 hover:bg-surface-50 active:bg-surface-100"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4 text-surface-600" />
        </button>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0.5">
        {DAYS.map((d) => (
          <div key={d} className="py-1 text-center text-[10px] font-medium text-surface-400">
            {d}
          </div>
        ))}
      </div>

      {/* Date cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((dateStr, i) => {
          if (!dateStr) {
            return <div key={`empty-${i}`} />;
          }

          const status = getStatus(dateStr);
          const past = isPast(dateStr);
          const isToday = dateStr === todayStr;
          const loading = actionLoading === dateStr;

          let cellClass = 'relative flex h-9 w-full items-center justify-center rounded-md text-xs font-medium transition-colors ';
          if (past) {
            cellClass += 'text-surface-300 cursor-default ';
          } else if (status === 'blocked') {
            cellClass += 'bg-red-100 text-red-700 border border-red-200 ';
            if (!readOnly) cellClass += 'cursor-pointer hover:bg-red-200 active:bg-red-300 ';
          } else {
            cellClass += 'text-surface-800 border border-surface-100 ';
            if (!readOnly && !past) cellClass += 'cursor-pointer hover:bg-surface-50 active:bg-surface-100 ';
            if (isToday) cellClass += 'ring-2 ring-primary-400 ';
          }

          return (
            <button
              key={dateStr}
              onClick={() => !past && handleDateClick(dateStr)}
              disabled={past || readOnly || loading}
              className={cellClass}
              title={status === 'blocked' ? 'Blocked — click to unblock' : !readOnly ? 'Click to block' : undefined}
            >
              {loading ? (
                <span className="h-3 w-3 animate-spin rounded-full border border-surface-400 border-t-transparent" />
              ) : (
                new Date(year, month, parseInt(dateStr.slice(8), 10)).getDate()
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-1">
        <div className="flex items-center gap-1.5 text-xs text-surface-500">
          <div className="h-3 w-3 rounded border border-surface-200 bg-white" />
          Available
        </div>
        <div className="flex items-center gap-1.5 text-xs text-surface-500">
          <div className="h-3 w-3 rounded border border-red-200 bg-red-100" />
          Blocked
        </div>
        {!readOnly && (
          <p className="text-xs text-surface-400">Tap a date to block/unblock it</p>
        )}
      </div>
    </div>
  );
}
