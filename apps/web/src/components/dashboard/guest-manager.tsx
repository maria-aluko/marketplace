'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  MessageCircle,
  Mail,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { GuestStatus } from '@eventtrust/shared';
import type {
  GuestListSummaryResponse,
  GuestListResponse,
  GuestResponse,
} from '@eventtrust/shared';

function extractData<T>(result: { success: boolean; data?: unknown }): T | null {
  if (!result.success || !result.data) return null;
  const body = result.data as { data?: T };
  return body.data ?? (result.data as T);
}

const STATUS_LABELS: Record<GuestStatus, string> = {
  [GuestStatus.PENDING]: 'Pending',
  [GuestStatus.INVITED]: 'Invited',
  [GuestStatus.COMING]: 'Coming',
  [GuestStatus.NOT_COMING]: 'Not Coming',
};

const STATUS_COLORS: Record<GuestStatus, string> = {
  [GuestStatus.PENDING]: 'bg-surface-100 text-surface-600',
  [GuestStatus.INVITED]: 'bg-amber-100 text-amber-700',
  [GuestStatus.COMING]: 'bg-green-100 text-green-700',
  [GuestStatus.NOT_COMING]: 'bg-red-100 text-red-700',
};

const STATUS_ORDER: GuestStatus[] = [
  GuestStatus.PENDING,
  GuestStatus.INVITED,
  GuestStatus.COMING,
  GuestStatus.NOT_COMING,
];

function cycleStatus(current: GuestStatus): GuestStatus {
  const idx = STATUS_ORDER.indexOf(current);
  return STATUS_ORDER[(idx + 1) % STATUS_ORDER.length]!;
}

function GuestAvatar({ name }: { name: string }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export function GuestManager() {
  const [lists, setLists] = useState<GuestListSummaryResponse[]>([]);
  const [activeList, setActiveList] = useState<GuestListResponse | null>(null);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialogs
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [editListId, setEditListId] = useState<string | null>(null);
  const [guestDialogOpen, setGuestDialogOpen] = useState(false);
  const [editGuest, setEditGuest] = useState<GuestResponse | null>(null);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [copied, setCopied] = useState(false);

  // List form
  const [listName, setListName] = useState('');
  const [listDate, setListDate] = useState('');
  const [listPlanned, setListPlanned] = useState('');
  const [savingList, setSavingList] = useState(false);

  // Guest form
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestStatus, setGuestStatus] = useState<GuestStatus>(GuestStatus.PENDING);
  const [guestPlusOne, setGuestPlusOne] = useState(false);
  const [guestPlusOneName, setGuestPlusOneName] = useState('');
  const [guestNotes, setGuestNotes] = useState('');
  const [savingGuest, setSavingGuest] = useState(false);

  // Bulk add
  const [bulkText, setBulkText] = useState('');
  const [savingBulk, setSavingBulk] = useState(false);

  const loadLists = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await apiClient.get<{ data: GuestListSummaryResponse[] }>('/guest-lists');
    setLoading(false);
    const data = extractData<GuestListSummaryResponse[]>(result);
    if (data) {
      setLists(data);
      setActiveListId((prev) => prev ?? data[0]?.id ?? null);
    } else if (!result.success) {
      setError('Failed to load guest lists');
    }
  }, []);

  const loadActiveList = useCallback(async (id: string) => {
    const result = await apiClient.get<{ data: GuestListResponse }>(`/guest-lists/${id}`);
    const data = extractData<GuestListResponse>(result);
    if (data) setActiveList(data);
  }, []);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  useEffect(() => {
    if (activeListId) loadActiveList(activeListId);
    else setActiveList(null);
  }, [activeListId, loadActiveList]);

  const openNewList = () => {
    setEditListId(null);
    setListName('');
    setListDate('');
    setListPlanned('');
    setListDialogOpen(true);
  };

  const openEditList = (summary: GuestListSummaryResponse) => {
    setEditListId(summary.id);
    setListName(summary.name);
    setListDate(summary.eventDate ?? '');
    setListPlanned(summary.plannedCount ? String(summary.plannedCount) : '');
    setListDialogOpen(true);
  };

  const handleSaveList = async () => {
    if (!listName.trim()) return;
    setSavingList(true);
    const payload = {
      name: listName.trim(),
      eventDate: listDate || undefined,
      plannedCount: listPlanned ? parseInt(listPlanned, 10) : undefined,
    };

    let savedId = editListId;
    if (editListId) {
      await apiClient.patch(`/guest-lists/${editListId}`, payload);
    } else {
      const result = await apiClient.post<{ data: GuestListResponse }>('/guest-lists', payload);
      const data = extractData<GuestListResponse>(result);
      savedId = data?.id ?? null;
    }

    setSavingList(false);
    setListDialogOpen(false);
    if (savedId) setActiveListId(savedId);
    await loadLists();
    if (savedId) await loadActiveList(savedId);
  };

  const handleDeleteList = async (id: string) => {
    await apiClient.delete(`/guest-lists/${id}`);
    const next = lists.find((l) => l.id !== id);
    setActiveListId(next?.id ?? null);
    await loadLists();
  };

  const openAddGuest = () => {
    setEditGuest(null);
    setGuestName('');
    setGuestPhone('');
    setGuestStatus(GuestStatus.PENDING);
    setGuestPlusOne(false);
    setGuestPlusOneName('');
    setGuestNotes('');
    setGuestDialogOpen(true);
  };

  const openEditGuest = (guest: GuestResponse) => {
    setEditGuest(guest);
    setGuestName(guest.name);
    setGuestPhone(guest.phone ?? '');
    setGuestStatus(guest.status);
    setGuestPlusOne(guest.plusOne);
    setGuestPlusOneName(guest.plusOneName ?? '');
    setGuestNotes(guest.notes ?? '');
    setGuestDialogOpen(true);
  };

  const handleSaveGuest = async () => {
    if (!activeListId || !guestName.trim()) return;
    setSavingGuest(true);

    const payload = {
      name: guestName.trim(),
      phone: guestPhone.trim() || undefined,
      status: guestStatus,
      plusOne: guestPlusOne,
      plusOneName: guestPlusOne && guestPlusOneName.trim() ? guestPlusOneName.trim() : undefined,
      notes: guestNotes.trim() || undefined,
    };

    if (editGuest) {
      await apiClient.patch(`/guest-lists/${activeListId}/guests/${editGuest.id}`, payload);
    } else {
      await apiClient.post(`/guest-lists/${activeListId}/guests`, payload);
    }

    setSavingGuest(false);
    setGuestDialogOpen(false);
    await loadActiveList(activeListId);
    await loadLists();
  };

  const handleDeleteGuest = async (guestId: string) => {
    if (!activeListId) return;
    setActiveList((prev) =>
      prev ? { ...prev, guests: prev.guests.filter((g) => g.id !== guestId) } : prev,
    );
    const result = await apiClient.delete(`/guest-lists/${activeListId}/guests/${guestId}`);
    if (!result.success) {
      await loadActiveList(activeListId);
    } else {
      await loadLists();
    }
  };

  const handleCycleStatus = async (guest: GuestResponse) => {
    if (!activeListId) return;
    const newStatus = cycleStatus(guest.status);
    setActiveList((prev) =>
      prev
        ? { ...prev, guests: prev.guests.map((g) => (g.id === guest.id ? { ...g, status: newStatus } : g)) }
        : prev,
    );
    await apiClient.patch(`/guest-lists/${activeListId}/guests/${guest.id}`, { status: newStatus });
    await loadLists();
  };

  const handleToggleInvitationSent = async (guest: GuestResponse) => {
    if (!activeListId) return;
    const newVal = !guest.invitationSent;
    setActiveList((prev) =>
      prev
        ? { ...prev, guests: prev.guests.map((g) => (g.id === guest.id ? { ...g, invitationSent: newVal } : g)) }
        : prev,
    );
    await apiClient.patch(`/guest-lists/${activeListId}/guests/${guest.id}`, {
      invitationSent: newVal,
    });
  };

  const handleWhatsAppClick = async (guest: GuestResponse) => {
    if (!activeListId || !guest.phone) return;
    if (!guest.invitationSent) {
      setActiveList((prev) =>
        prev
          ? { ...prev, guests: prev.guests.map((g) => (g.id === guest.id ? { ...g, invitationSent: true } : g)) }
          : prev,
      );
      await apiClient.patch(`/guest-lists/${activeListId}/guests/${guest.id}`, {
        invitationSent: true,
      });
    }
  };

  const handleBulkAdd = async () => {
    if (!activeListId || !bulkText.trim()) return;
    setSavingBulk(true);
    const names = bulkText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (names.length === 0) {
      setSavingBulk(false);
      return;
    }
    await apiClient.post(`/guest-lists/${activeListId}/guests/bulk`, {
      guests: names.map((name) => ({ name })),
    });
    setSavingBulk(false);
    setBulkDialogOpen(false);
    setBulkText('');
    await loadActiveList(activeListId);
    await loadLists();
  };

  const handleImportContacts = async () => {
    if (!activeListId) return;
    // Web Contact Picker API
    const contacts = await (navigator as any).contacts.select(['name', 'tel'], { multiple: true });
    const guests: Array<{ name: string; phone?: string }> = contacts
      .map((c: any) => ({
        name: (c.name?.[0] ?? '').trim(),
        phone: c.tel?.[0]?.trim() || undefined,
      }))
      .filter((g: any) => g.name);
    if (guests.length === 0) return;
    await apiClient.post(`/guest-lists/${activeListId}/guests/bulk`, { guests });
    await loadActiveList(activeListId);
    await loadLists();
  };

  const handleCopyNumbers = async () => {
    const phones = (activeList?.guests ?? [])
      .filter((g) => g.phone)
      .map((g) => g.phone as string)
      .join(', ');
    if (!phones) return;
    await navigator.clipboard.writeText(phones);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const supportsContactPicker =
    typeof navigator !== 'undefined' && 'contacts' in navigator;

  if (loading) {
    return (
      <div className="space-y-3 py-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (error) {
    return <div className="py-8 text-center text-sm text-red-600">{error}</div>;
  }

  const activeSummary = lists.find((l) => l.id === activeListId);

  return (
    <div className="space-y-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Guests</h2>
        <Button size="sm" onClick={openNewList}>
          <Plus className="mr-1 h-4 w-4" />
          New List
        </Button>
      </div>

      {/* Empty state */}
      {lists.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <Users className="h-10 w-10 text-surface-300" />
            <p className="font-medium">No guest lists yet</p>
            <p className="text-sm text-surface-500">Create a list to start managing your guests</p>
            <Button onClick={openNewList}>Create List</Button>
          </CardContent>
        </Card>
      )}

      {/* List selector pills */}
      {lists.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {lists.map((l) => (
            <button
              key={l.id}
              onClick={() => setActiveListId(l.id)}
              className={cn(
                'flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium',
                activeListId === l.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-100 text-surface-700',
              )}
            >
              {l.name}
            </button>
          ))}
          <button
            onClick={openNewList}
            className="flex-shrink-0 rounded-full bg-surface-100 px-4 py-1.5 text-sm font-medium text-surface-700"
          >
            + New
          </button>
        </div>
      )}

      {/* Active list content */}
      {activeList && activeSummary && (
        <>
          {/* List heading with edit/delete */}
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium">{activeList.name}</h3>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => openEditList(activeSummary)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteList(activeList.id)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>

          {/* Stats card */}
          <Card className="border-primary-200 bg-primary-50">
            <CardContent className="pt-4 pb-4">
              {activeSummary.plannedCount ? (
                <div className="space-y-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-surface-500">
                    Target: {activeSummary.plannedCount} guests
                  </p>
                  <Progress
                    value={Math.min(
                      100,
                      Math.round((activeSummary.totalAttending / activeSummary.plannedCount) * 100),
                    )}
                    className="h-2.5 bg-surface-200"
                  />
                  <p className="text-right text-xs text-surface-500">
                    {activeSummary.totalAttending} confirmed of {activeSummary.plannedCount} (
                    {Math.round(
                      (activeSummary.totalAttending / activeSummary.plannedCount) * 100,
                    )}
                    %)
                  </p>
                  <div className="flex justify-between text-xs">
                    <span className="text-green-700">✓ {activeSummary.totalAttending} Coming</span>
                    <span className="text-red-600">✗ {activeSummary.totalDeclined} Declined</span>
                    <span className="text-surface-500">? {activeSummary.totalPending} Pending</span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between text-xs">
                  <span className="text-green-700">✓ {activeSummary.totalAttending} Coming</span>
                  <span className="text-red-600">✗ {activeSummary.totalDeclined} Declined</span>
                  <span className="text-surface-500">? {activeSummary.totalPending} Pending</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action row */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={openAddGuest}>
              <Plus className="mr-1 h-4 w-4" />
              Add Guest
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setBulkDialogOpen(true)}
            >
              Bulk Add
            </Button>
            {supportsContactPicker && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleImportContacts}
              >
                Import
              </Button>
            )}
          </div>

          {/* Guest list */}
          <div className="space-y-2">
            {activeList.guests.length === 0 && (
              <p className="text-center text-sm text-surface-500">
                Add your first guest to get started
              </p>
            )}
            {activeList.guests.map((guest) => (
              <div
                key={guest.id}
                className="rounded-lg border border-surface-200 bg-white px-3 py-2.5"
              >
                <div className="flex items-start gap-2.5">
                  <GuestAvatar name={guest.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-medium">{guest.name}</span>
                      <button
                        onClick={() => handleCycleStatus(guest)}
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          STATUS_COLORS[guest.status],
                        )}
                      >
                        {STATUS_LABELS[guest.status]}
                      </button>
                      {guest.plusOne && (
                        <span className="rounded-full bg-surface-100 px-1.5 py-0.5 text-xs text-surface-600">
                          +1{guest.plusOneName ? ` ${guest.plusOneName}` : ''}
                        </span>
                      )}
                    </div>
                    {guest.phone && (
                      <p className="mt-0.5 text-xs text-surface-500">{guest.phone}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {guest.phone && (
                      <a
                        href={`https://wa.me/${guest.phone.replace('+', '')}?text=You're invited!`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleWhatsAppClick(guest)}
                        className="p-1.5 text-green-600 active:text-green-800"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </a>
                    )}
                    <button
                      onClick={() => handleToggleInvitationSent(guest)}
                      className={cn(
                        'p-1.5',
                        guest.invitationSent ? 'text-green-600' : 'text-surface-300',
                      )}
                      title={guest.invitationSent ? 'Invitation sent' : 'Mark as sent'}
                    >
                      <Mail className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openEditGuest(guest)}
                      className="p-1.5 text-surface-400 active:text-surface-700"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteGuest(guest.id)}
                      className="p-1.5 text-surface-400 active:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* WhatsApp panel */}
          {activeList.guests.some((g) => g.phone) && (
            <div className="rounded-lg border border-surface-200">
              <button
                onClick={() => setShowWhatsApp((v) => !v)}
                className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium"
              >
                <span className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-green-600" />
                  Share via WhatsApp
                </span>
                {showWhatsApp ? (
                  <ChevronUp className="h-4 w-4 text-surface-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-surface-400" />
                )}
              </button>
              {showWhatsApp && (
                <div className="border-t border-surface-100 px-3 pb-3 pt-2">
                  <div className="mb-2 space-y-1">
                    {activeList.guests
                      .filter((g) => g.phone)
                      .map((g) => (
                        <div key={g.id} className="flex items-center justify-between text-sm">
                          <span className="text-surface-700">{g.name}</span>
                          <a
                            href={`https://wa.me/${(g.phone as string).replace('+', '')}?text=You're invited!`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => handleWhatsAppClick(g)}
                            className="text-xs text-green-600"
                          >
                            Send
                          </a>
                        </div>
                      ))}
                  </div>
                  <Button variant="outline" size="sm" className="w-full" onClick={handleCopyNumbers}>
                    {copied ? (
                      <>
                        <Check className="mr-1.5 h-4 w-4 text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1.5 h-4 w-4" />
                        Copy all numbers
                      </>
                    )}
                  </Button>
                  <p className="mt-1.5 text-center text-xs text-surface-400">
                    Paste these numbers into a new WhatsApp group
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* New / Edit List Dialog */}
      <Dialog
        open={listDialogOpen}
        onOpenChange={(open) => {
          setListDialogOpen(open);
          if (!open) setEditListId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editListId ? 'Edit List' : 'New Guest List'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="list-name">Name</Label>
              <Input
                id="list-name"
                placeholder="e.g. My Wedding 2026"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="list-planned">
                Target Guests{' '}
                <span className="font-normal text-surface-400">— optional</span>
              </Label>
              <Input
                id="list-planned"
                type="number"
                inputMode="numeric"
                placeholder="e.g. 200"
                value={listPlanned}
                onChange={(e) => setListPlanned(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="list-date">
                Event Date{' '}
                <span className="font-normal text-surface-400">— optional</span>
              </Label>
              <Input
                id="list-date"
                type="date"
                value={listDate}
                onChange={(e) => setListDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setListDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveList} disabled={!listName.trim() || savingList}>
              {savingList ? 'Saving…' : editListId ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Guest Dialog */}
      <Dialog open={guestDialogOpen} onOpenChange={setGuestDialogOpen}>
        <DialogContent className="flex max-h-[90dvh] flex-col gap-0 p-0">
          <DialogHeader className="shrink-0 border-b border-surface-100 px-4 py-4">
            <DialogTitle>{editGuest ? 'Edit Guest' : 'Add Guest'}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="guest-name">Name</Label>
                <Input
                  id="guest-name"
                  placeholder="Full name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="guest-phone">
                  Phone{' '}
                  <span className="font-normal text-surface-400">— optional, E.164 e.g. +2348012345678</span>
                </Label>
                <Input
                  id="guest-phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="+2348012345678"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="guest-status">Status</Label>
                <Select
                  value={guestStatus}
                  onValueChange={(v) => setGuestStatus(v as GuestStatus)}
                >
                  <SelectTrigger id="guest-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_ORDER.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-surface-200 px-3 py-2.5">
                <Label htmlFor="guest-plus-one" className="cursor-pointer">
                  +1 (bringing a partner)
                </Label>
                <Switch
                  id="guest-plus-one"
                  checked={guestPlusOne}
                  onCheckedChange={setGuestPlusOne}
                />
              </div>
              {guestPlusOne && (
                <div className="space-y-1.5">
                  <Label htmlFor="guest-plus-one-name">
                    Partner name{' '}
                    <span className="font-normal text-surface-400">— optional</span>
                  </Label>
                  <Input
                    id="guest-plus-one-name"
                    placeholder="Partner's name"
                    value={guestPlusOneName}
                    onChange={(e) => setGuestPlusOneName(e.target.value)}
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="guest-notes">
                  Notes{' '}
                  <span className="font-normal text-surface-400">— optional</span>
                </Label>
                <Input
                  id="guest-notes"
                  placeholder="Any notes"
                  value={guestNotes}
                  onChange={(e) => setGuestNotes(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="shrink-0 border-t border-surface-100 px-4 py-3">
            <Button variant="outline" onClick={() => setGuestDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveGuest} disabled={!guestName.trim() || savingGuest}>
              {savingGuest ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="flex max-h-[90dvh] flex-col gap-0 p-0">
          <DialogHeader className="shrink-0 border-b border-surface-100 px-4 py-4">
            <DialogTitle>Bulk Add Guests</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-names">
                Guest names — one per line
              </Label>
              <textarea
                id="bulk-names"
                className="min-h-[180px] w-full rounded-md border border-surface-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                placeholder={'Ade Johnson\nChioma Obi\nEmeka Peters'}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
              />
              <p className="text-xs text-surface-400">
                Paste your guest list. Each non-empty line becomes one guest.
              </p>
            </div>
          </div>
          <DialogFooter className="shrink-0 border-t border-surface-100 px-4 py-3">
            <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkAdd} disabled={!bulkText.trim() || savingBulk}>
              {savingBulk ? 'Adding…' : 'Add Guests'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
