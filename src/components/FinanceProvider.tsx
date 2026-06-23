"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
export type Category = {
  id: string;
  name: string;
  icon: string;
  isDefault: boolean;
};

export type Transaction = {
  id: string;
  type: "income" | "expense";
  amount: number;
  date: string;
  note: string;
  categoryId: string;
};

export type Budget = {
  id: string;
  month: number;
  year: number;
  limit: number;
  categoryId: string;
};

type FinanceContextType = {
  categories: Category[];
  setCategories: (cats: Category[]) => void;
  addCategory: (cat: Omit<Category, "id" | "isDefault">) => { error?: string };
  updateCategory: (id: string, data: Partial<Omit<Category, "id">>) => { error?: string };
  deleteCategory: (id: string) => { error?: string };

  transactions: Transaction[];
  setTransactions: (txs: Transaction[]) => void;
  addTransaction: (tx: Omit<Transaction, "id">) => void;
  updateTransaction: (id: string, data: Partial<Omit<Transaction, "id">>) => void;
  deleteTransaction: (id: string) => void;

  budgets: Budget[];
  setBudgets: (buds: Budget[]) => void;
  addBudget: (bud: Omit<Budget, "id">) => void;
  deleteBudget: (id: string) => void;

  currency: string;
  setCurrency: (code: string) => void;

  deviceId: string;
  lastSynced: string;
  isSyncing: boolean;
  uploadBackup: () => Promise<void>;
  restoreBackup: (deviceId: string) => Promise<{ success: boolean; error?: string }>;
};

// ── Defaults ──────────────────────────────────────────────────────────────────
const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat-1",  name: "Salary",          icon: "💰", isDefault: true },
  { id: "cat-2",  name: "Groceries",       icon: "🛒", isDefault: true },
  { id: "cat-3",  name: "Rent / EMI",      icon: "🏠", isDefault: true },
  { id: "cat-4",  name: "Petrol & Transit",icon: "🚗", isDefault: true },
  { id: "cat-5",  name: "Dining Out",      icon: "🍔", isDefault: true },
  { id: "cat-6",  name: "Utilities",       icon: "⚡", isDefault: true },
  { id: "cat-7",  name: "Health",          icon: "💊", isDefault: true },
  { id: "cat-8",  name: "SIP & Invest",    icon: "📈", isDefault: true },
  { id: "cat-9",  name: "Entertainment",   icon: "🎬", isDefault: true },
  { id: "cat-10", name: "Shopping",        icon: "🛍️", isDefault: true },
  { id: "cat-11", name: "Education",       icon: "📚", isDefault: true },
  { id: "cat-12", name: "Travel",          icon: "✈️", isDefault: true },
];

// ── Context ───────────────────────────────────────────────────────────────────
const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────
export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [currency, setCurrencyState] = useState<string>("INR");
  const [deviceId, setDeviceId] = useState<string>("");
  const [lastSynced, setLastSynced] = useState<string>("");
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedCats = JSON.parse(localStorage.getItem("finance_categories") || "null");
    const savedTxs  = JSON.parse(localStorage.getItem("finance_transactions") || "[]");
    const savedCur  = localStorage.getItem("finance_currency") || "INR";
    const savedBuds = JSON.parse(localStorage.getItem("finance_budgets") || "[]");
    let savedDevId  = localStorage.getItem("finance_device_id");

    if (!savedDevId) {
      // Create a nice human readable 12-char device ID like DEV-AAAA-BBBB
      const rand1 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const rand2 = Math.random().toString(36).substring(2, 6).toUpperCase();
      savedDevId = `DEV-${rand1}-${rand2}`;
      localStorage.setItem("finance_device_id", savedDevId);
    }
    // Set cookie for server queries
    document.cookie = `deviceId=${savedDevId}; path=/; max-age=31536000; SameSite=Lax`;

    const savedSynced = localStorage.getItem("finance_last_synced") || "";

    setCategories(savedCats && savedCats.length > 0 ? savedCats : DEFAULT_CATEGORIES);
    setTransactions(savedTxs);
    setBudgets(savedBuds);
    setCurrencyState(savedCur);
    setDeviceId(savedDevId);
    setLastSynced(savedSynced);
    setMounted(true);
  }, []);

  // ── Sync Helpers ───────────────────────────────────────────────────────────
  const uploadBackup = useCallback(async (
    currentId = deviceId,
    cats = categories,
    txs = transactions,
    cur = currency,
    buds = budgets
  ) => {
    if (!currentId) return;
    setIsSyncing(true);
    try {
      const res = await fetch(`/api/sync?deviceId=${currentId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ categories: cats, transactions: txs, currency: cur, budgets: buds }),
      });
      if (res.ok) {
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = `Today at ${now}`;
        setLastSynced(dateStr);
        localStorage.setItem("finance_last_synced", dateStr);
      }
    } catch (err) {
      console.error("Auto backup failed:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [deviceId, categories, transactions, currency, budgets]);

  const restoreBackup = useCallback(async (targetDeviceId: string): Promise<{ success: boolean; error?: string }> => {
    setIsSyncing(true);
    try {
      const res = await fetch(`/api/sync?deviceId=${targetDeviceId}`);
      if (!res.ok) {
        if (res.status === 404) {
          return { success: false, error: "Device ID not found. Ensure the other device is connected." };
        }
        return { success: false, error: "Failed to connect to sync server." };
      }
      const data = await res.json();
      if (data.error) {
        return { success: false, error: data.error };
      }

      // Update state
      const newCats = data.categories && data.categories.length > 0 ? data.categories : DEFAULT_CATEGORIES;
      const newTxs = data.transactions || [];
      const newCur = data.currency || "INR";
      const newBuds = data.budgets || [];

      setCategories(newCats);
      setTransactions(newTxs);
      setCurrencyState(newCur);
      setBudgets(newBuds);
      setDeviceId(targetDeviceId);

      // Save directly to localStorage
      localStorage.setItem("finance_categories",   JSON.stringify(newCats));
      localStorage.setItem("finance_transactions",  JSON.stringify(newTxs));
      localStorage.setItem("finance_currency",      newCur);
      localStorage.setItem("finance_budgets",       JSON.stringify(newBuds));
      localStorage.setItem("finance_device_id",     targetDeviceId);
      
      // Set the cookie
      document.cookie = `deviceId=${targetDeviceId}; path=/; max-age=31536000; SameSite=Lax`;

      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = `Today at ${now}`;
      setLastSynced(dateStr);
      localStorage.setItem("finance_last_synced", dateStr);

      return { success: true };
    } catch (err: any) {
      console.error("Restore backup failed:", err);
      return { success: false, error: err.message || "Failed to restore backup." };
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Persist on change with debounce auto-upload
  useEffect(() => {
    if (!mounted || !deviceId) return;
    
    localStorage.setItem("finance_categories",   JSON.stringify(categories));
    localStorage.setItem("finance_transactions",  JSON.stringify(transactions));
    localStorage.setItem("finance_currency",      currency);
    localStorage.setItem("finance_budgets",       JSON.stringify(budgets));

    const timer = setTimeout(() => {
      uploadBackup(deviceId, categories, transactions, currency, budgets);
    }, 1500); // 1.5s debounce to cluster fast changes

    return () => clearTimeout(timer);
  }, [categories, transactions, currency, deviceId, mounted, uploadBackup]);

  // ── Category helpers ────────────────────────────────────────────────────────
  const addCategory = useCallback((cat: Omit<Category, "id" | "isDefault">): { error?: string } => {
    const name = cat.name.trim();
    if (!name) return { error: "Name is required" };
    const duplicate = categories.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (duplicate) return { error: "Category already exists" };
    const newCat: Category = { id: `cat-${Date.now()}`, name, icon: cat.icon, isDefault: false };
    setCategories(prev => [...prev, newCat]);
    return {};
  }, [categories]);

  const updateCategory = useCallback((id: string, data: Partial<Omit<Category, "id">>): { error?: string } => {
    const name = data.name?.trim();
    if (name) {
      const duplicate = categories.find(c => c.name.toLowerCase() === name.toLowerCase() && c.id !== id);
      if (duplicate) return { error: "Category already exists" };
    }
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...data, name: name ?? c.name } : c));
    return {};
  }, [categories]);

  const deleteCategory = useCallback((id: string): { error?: string } => {
    const inUse = transactions.some(t => t.categoryId === id);
    if (inUse) return { error: "Cannot delete: category is used by transactions" };
    setCategories(prev => prev.filter(c => c.id !== id));
    return {};
  }, [transactions]);

  // ── Transaction helpers ─────────────────────────────────────────────────────
  const addTransaction = useCallback((tx: Omit<Transaction, "id">) => {
    const newTx: Transaction = { id: `tx-${Date.now()}`, ...tx };
    setTransactions(prev => [newTx, ...prev]);
  }, []);

  const updateTransaction = useCallback((id: string, data: Partial<Omit<Transaction, "id">>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Budget helpers ─────────────────────────────────────────────────────────
  const addBudget = useCallback((bud: Omit<Budget, "id">) => {
    setBudgets(prev => {
      const existingIdx = prev.findIndex(
        b => b.categoryId === bud.categoryId && b.month === bud.month && b.year === bud.year
      );
      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx] = { ...next[existingIdx], limit: bud.limit };
        return next;
      } else {
        const newBud: Budget = { id: `bud-${Date.now()}`, ...bud };
        return [...prev, newBud];
      }
    });
  }, []);

  const deleteBudget = useCallback((id: string) => {
    setBudgets(prev => prev.filter(b => b.id !== id));
  }, []);

  const setCurrency = useCallback((code: string) => {
    setCurrencyState(code);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center animate-pulse text-muted-foreground bg-background">
        Loading…
      </div>
    );
  }

  // Create stable upload reference for the context
  const triggerUpload = () => uploadBackup(deviceId, categories, transactions, currency, budgets);

  return (
    <FinanceContext.Provider value={{
      categories, setCategories, addCategory, updateCategory, deleteCategory,
      transactions, setTransactions, addTransaction, updateTransaction, deleteTransaction,
      budgets, setBudgets, addBudget, deleteBudget,
      currency, setCurrency,
      deviceId, lastSynced, isSyncing,
      uploadBackup: triggerUpload,
      restoreBackup
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) throw new Error("useFinance must be used within a FinanceProvider");
  return context;
}
