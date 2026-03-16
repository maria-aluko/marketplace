'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Pencil, Trash2, Plus, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/api-client';
import { formatNaira, cn } from '@/lib/utils';
import type { BudgetSummaryResponse, BudgetResponse, BudgetItemResponse } from '@eventtrust/shared';

const CATEGORY_CHIPS = [
  'Venue',
  'Catering',
  'Photography',
  'Videography',
  'Decoration',
  'MC/DJ',
  'Makeup',
  'Generator',
  'Tent & Chairs',
  'Lighting',
  'Invitation Cards',
  'Transportation',
  'Miscellaneous',
];

function extractData<T>(result: { success: boolean; data?: unknown }): T | null {
  if (!result.success || !result.data) return null;
  const body = result.data as { data?: T };
  return body.data ?? (result.data as T);
}

export function BudgetManager() {
  const [budgets, setBudgets] = useState<BudgetSummaryResponse[]>([]);
  const [activeBudget, setActiveBudget] = useState<BudgetResponse | null>(null);
  const [activeBudgetId, setActiveBudgetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [newBudgetOpen, setNewBudgetOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [editItem, setEditItem] = useState<BudgetItemResponse | null>(null);

  // New/edit budget form
  const [newBudgetName, setNewBudgetName] = useState('');
  const [newBudgetTotal, setNewBudgetTotal] = useState('');
  const [newBudgetDate, setNewBudgetDate] = useState('');
  const [editBudgetId, setEditBudgetId] = useState<string | null>(null);
  const [savingBudget, setSavingBudget] = useState(false);

  // Item form
  const [itemName, setItemName] = useState('');
  const [itemBudgeted, setItemBudgeted] = useState('');
  const [itemActual, setItemActual] = useState('');
  const [itemNotes, setItemNotes] = useState('');
  const [savingItem, setSavingItem] = useState(false);

  const loadBudgets = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await apiClient.get<{ data: BudgetSummaryResponse[] }>('/budgets');
    setLoading(false);
    const data = extractData<BudgetSummaryResponse[]>(result);
    if (data) {
      setBudgets(data);
      setActiveBudgetId((prev) => prev ?? data[0]?.id ?? null);
    } else if (!result.success) {
      setError('Failed to load budgets');
    }
  }, []);

  const loadActiveBudget = useCallback(async (id: string) => {
    const result = await apiClient.get<{ data: BudgetResponse }>(`/budgets/${id}`);
    const data = extractData<BudgetResponse>(result);
    if (data) setActiveBudget(data);
  }, []);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  useEffect(() => {
    if (activeBudgetId) loadActiveBudget(activeBudgetId);
    else setActiveBudget(null);
  }, [activeBudgetId, loadActiveBudget]);

  const totals = useMemo(() => {
    const items = activeBudget?.items ?? [];
    const budgeted = items.reduce((s, i) => s + i.budgeted, 0);
    const actual = items.reduce((s, i) => s + i.actual, 0);
    const cap = activeBudget?.totalAmount ?? 0;
    return {
      budgeted,
      actual,
      cap,
      remaining: cap > 0 ? cap - actual : budgeted - actual,
      unallocated: cap > 0 ? cap - budgeted : 0,
      allocatedPct: cap > 0 ? Math.min(100, Math.round((budgeted / cap) * 100)) : 0,
      spentPct: cap > 0 ? Math.min(100, Math.round((actual / cap) * 100)) : 0,
      // fallback when no cap: spent vs budgeted
      spentOfBudgetedPct: budgeted > 0 ? Math.min(100, Math.round((actual / budgeted) * 100)) : 0,
    };
  }, [activeBudget]);

  const handleSaveBudget = async () => {
    if (!newBudgetName.trim()) return;
    setSavingBudget(true);
    const totalAmount = newBudgetTotal ? Math.round(parseFloat(newBudgetTotal) * 100) : undefined;
    const payload = {
      name: newBudgetName.trim(),
      totalAmount,
      eventDate: newBudgetDate || undefined,
    };

    let savedId = editBudgetId;
    if (editBudgetId) {
      await apiClient.patch(`/budgets/${editBudgetId}`, payload);
    } else {
      const result = await apiClient.post<{ data: BudgetResponse }>('/budgets', payload);
      const data = extractData<BudgetResponse>(result);
      savedId = data?.id ?? null;
    }

    setSavingBudget(false);
    setNewBudgetOpen(false);
    setNewBudgetName('');
    setNewBudgetTotal('');
    setNewBudgetDate('');
    setEditBudgetId(null);
    if (savedId) setActiveBudgetId(savedId);
    await loadBudgets();
    if (savedId) await loadActiveBudget(savedId);
  };

  const handleDeleteBudget = async (id: string) => {
    await apiClient.delete(`/budgets/${id}`);
    const next = budgets.find((b) => b.id !== id);
    setActiveBudgetId(next?.id ?? null);
    await loadBudgets();
  };

  const openAddItem = () => {
    setItemName('');
    setItemBudgeted('');
    setItemActual('');
    setItemNotes('');
    setEditItem(null);
    setAddItemOpen(true);
  };

  const openEditItem = (item: BudgetItemResponse) => {
    setItemName(item.name);
    setItemBudgeted(String(Math.round(item.budgeted / 100)));
    setItemActual(String(Math.round(item.actual / 100)));
    setItemNotes(item.notes ?? '');
    setEditItem(item);
    setAddItemOpen(true);
  };

  const handleSaveItem = async () => {
    if (!activeBudgetId || !itemName.trim()) return;
    setSavingItem(true);

    const budgeted = Math.round(parseFloat(itemBudgeted || '0') * 100);
    const actual = Math.round(parseFloat(itemActual || '0') * 100);
    const body = {
      name: itemName.trim(),
      budgeted,
      actual,
      notes: itemNotes.trim() || undefined,
    };

    if (editItem) {
      await apiClient.patch(`/budgets/${activeBudgetId}/items/${editItem.id}`, body);
    } else {
      await apiClient.post(`/budgets/${activeBudgetId}/items`, body);
    }

    setSavingItem(false);
    setAddItemOpen(false);
    await loadActiveBudget(activeBudgetId);
    await loadBudgets();
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!activeBudgetId) return;
    // Optimistic update
    setActiveBudget((prev) =>
      prev ? { ...prev, items: prev.items.filter((i) => i.id !== itemId) } : prev,
    );
    const result = await apiClient.delete(`/budgets/${activeBudgetId}/items/${itemId}`);
    if (!result.success) {
      await loadActiveBudget(activeBudgetId);
    } else {
      await loadBudgets();
    }
  };

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

  return (
    <div className="space-y-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Budget</h2>
        <Button
          size="sm"
          onClick={() => {
            setEditBudgetId(null);
            setNewBudgetOpen(true);
          }}
        >
          <Plus className="mr-1 h-4 w-4" />
          New Budget
        </Button>
      </div>

      {/* Empty state */}
      {budgets.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <Wallet className="h-10 w-10 text-surface-300" />
            <p className="font-medium">No budgets yet</p>
            <p className="text-sm text-surface-500">
              Create a budget to start tracking your event costs
            </p>
            <Button
              onClick={() => {
                setEditBudgetId(null);
                setNewBudgetOpen(true);
              }}
            >
              Create Budget
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Budget selector (multi-budget) */}
      {budgets.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {budgets.map((b) => (
            <button
              key={b.id}
              onClick={() => setActiveBudgetId(b.id)}
              className={cn(
                'flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium',
                activeBudgetId === b.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-100 text-surface-700',
              )}
            >
              {b.name}
            </button>
          ))}
          <button
            onClick={() => {
              setEditBudgetId(null);
              setNewBudgetOpen(true);
            }}
            className="flex-shrink-0 rounded-full bg-surface-100 px-4 py-1.5 text-sm font-medium text-surface-700"
          >
            + New
          </button>
        </div>
      )}

      {/* Single budget heading */}
      {budgets.length === 1 && activeBudget && (
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium">{activeBudget.name}</h3>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditBudgetId(activeBudget.id);
                setNewBudgetName(activeBudget.name);
                setNewBudgetTotal(
                  activeBudget.totalAmount
                    ? String(Math.round(activeBudget.totalAmount / 100))
                    : '',
                );
                setNewBudgetDate(activeBudget.eventDate ?? '');
                setNewBudgetOpen(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => activeBudget && handleDeleteBudget(activeBudget.id)}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      )}

      {/* Overview card */}
      {activeBudget && (
        <>
          <Card className="border-primary-200 bg-primary-50">
            <CardContent className="pt-4 pb-4">
              {totals.cap > 0 ? (
                /* ── With total budget cap ── */
                <div className="space-y-3">
                  {/* Total budget headline */}
                  <div className="flex items-baseline justify-between">
                    <p className="text-xs font-medium uppercase tracking-wide text-surface-500">
                      Total Budget
                    </p>
                    <p className="text-xl font-bold text-surface-900">{formatNaira(totals.cap)}</p>
                  </div>

                  {/* Allocated bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-surface-600">Allocated</span>
                      <span className="font-medium">
                        {formatNaira(totals.budgeted)}{' '}
                        <span className="text-surface-400">({totals.allocatedPct}%)</span>
                      </span>
                    </div>
                    <Progress value={totals.allocatedPct} className="h-2.5 bg-surface-200" />
                  </div>

                  {/* Spent bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-surface-600">Spent</span>
                      <span className="font-medium">
                        {formatNaira(totals.actual)}{' '}
                        <span className="text-surface-400">({totals.spentPct}%)</span>
                      </span>
                    </div>
                    <Progress
                      value={totals.spentPct}
                      className={cn(
                        'h-2.5 bg-surface-200',
                        totals.actual > totals.cap && '[&>div]:bg-red-500',
                      )}
                    />
                  </div>

                  {/* Bottom stats */}
                  <div className="flex justify-between pt-1 text-xs">
                    <span className="text-surface-500">
                      Unallocated:{' '}
                      <span
                        className={cn(
                          'font-medium',
                          totals.unallocated < 0 ? 'text-red-600' : 'text-surface-700',
                        )}
                      >
                        {formatNaira(totals.unallocated)}
                      </span>
                    </span>
                    <span className="text-surface-500">
                      Remaining:{' '}
                      <span
                        className={cn(
                          'font-medium',
                          totals.remaining < 0 ? 'text-red-600' : 'text-surface-700',
                        )}
                      >
                        {formatNaira(totals.remaining)}
                      </span>
                    </span>
                  </div>
                </div>
              ) : (
                /* ── No cap set: item-based summary ── */
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-surface-500">Allocated</p>
                      <p className="text-sm font-semibold">{formatNaira(totals.budgeted)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-surface-500">Spent</p>
                      <p className="text-sm font-semibold">{formatNaira(totals.actual)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-surface-500">Remaining</p>
                      <p
                        className={cn(
                          'text-sm font-semibold',
                          totals.remaining < 0 && 'text-red-600',
                        )}
                      >
                        {formatNaira(totals.remaining)}
                      </p>
                    </div>
                  </div>
                  <Progress value={totals.spentOfBudgetedPct} className="h-2 bg-surface-200" />
                  <p className="text-right text-xs text-surface-500">
                    {totals.spentOfBudgetedPct}% spent of allocated
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Button variant="outline" className="w-full" onClick={openAddItem}>
            <Plus className="mr-2 h-4 w-4" />
            Add Cost
          </Button>

          {/* Items list */}
          <div className="space-y-2">
            {activeBudget.items.length === 0 && (
              <p className="text-center text-sm text-surface-500">Add your first cost category</p>
            )}
            {activeBudget.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-surface-200 bg-white px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-surface-500">
                    {formatNaira(item.budgeted)} / {formatNaira(item.actual)}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditItem(item)}
                    className="p-1.5 text-surface-400 active:text-surface-700"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 text-surface-400 active:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* New / Edit Budget Dialog */}
      <Dialog
        open={newBudgetOpen}
        onOpenChange={(open) => {
          setNewBudgetOpen(open);
          if (!open) setEditBudgetId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editBudgetId ? 'Edit Budget' : 'New Budget'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="budget-name">Name</Label>
              <Input
                id="budget-name"
                placeholder="e.g. My Wedding 2026"
                value={newBudgetName}
                onChange={(e) => setNewBudgetName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="budget-total">
                Total Budget (₦) <span className="text-surface-400 font-normal">— optional</span>
              </Label>
              <Input
                id="budget-total"
                type="number"
                inputMode="numeric"
                placeholder="e.g. 500000"
                value={newBudgetTotal}
                onChange={(e) => setNewBudgetTotal(e.target.value)}
              />
              <p className="text-xs text-surface-400">
                Set an overall cap to track how much of your budget you've allocated and spent.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="budget-date">
                Event Date <span className="text-surface-400 font-normal">— optional</span>
              </Label>
              <Input
                id="budget-date"
                type="date"
                value={newBudgetDate}
                onChange={(e) => setNewBudgetDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewBudgetOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveBudget} disabled={!newBudgetName.trim() || savingBudget}>
              {savingBudget ? 'Saving…' : editBudgetId ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Item Dialog */}
      <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
        <DialogContent className="flex max-h-[90dvh] flex-col gap-0 p-0">
          <DialogHeader className="shrink-0 border-b border-surface-100 px-4 py-4">
            <DialogTitle>{editItem ? 'Edit Cost' : 'Add Cost'}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-4">
              {/* Category chips */}
              <div>
                <Label className="mb-2 block text-xs">Quick-fill category</Label>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {CATEGORY_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setItemName(chip)}
                      className={cn(
                        'flex-shrink-0 rounded-full border px-3 py-1 text-xs',
                        itemName === chip
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-surface-200 bg-white text-surface-700',
                      )}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="item-name">Category / Name</Label>
                <Input
                  id="item-name"
                  placeholder="e.g. Venue deposit"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="item-budgeted">Budgeted (₦)</Label>
                  <Input
                    id="item-budgeted"
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    value={itemBudgeted}
                    onChange={(e) => setItemBudgeted(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="item-actual">Actual (₦)</Label>
                  <Input
                    id="item-actual"
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    value={itemActual}
                    onChange={(e) => setItemActual(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="item-notes">Notes (optional)</Label>
                <Input
                  id="item-notes"
                  placeholder="Any additional notes"
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t border-surface-100 px-4 py-3">
            <Button variant="outline" onClick={() => setAddItemOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveItem} disabled={!itemName.trim() || savingItem}>
              {savingItem ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
