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

  currency: string;
  setCurrency: (code: string) => void;
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
  const [currency, setCurrencyState] = useState<string>("INR");
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedCats = JSON.parse(localStorage.getItem("finance_categories") || "null");
    const savedTxs  = JSON.parse(localStorage.getItem("finance_transactions") || "[]");
    const savedCur  = localStorage.getItem("finance_currency") || "INR";

    setCategories(savedCats && savedCats.length > 0 ? savedCats : DEFAULT_CATEGORIES);
    setTransactions(savedTxs);
    setCurrencyState(savedCur);
    setMounted(true);
  }, []);

  // Persist on change
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("finance_categories",   JSON.stringify(categories));
    localStorage.setItem("finance_transactions",  JSON.stringify(transactions));
    localStorage.setItem("finance_currency",      currency);
  }, [categories, transactions, currency, mounted]);

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

  const setCurrency = useCallback((code: string) => {
    setCurrencyState(code);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center animate-pulse text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <FinanceContext.Provider value={{
      categories, setCategories, addCategory, updateCategory, deleteCategory,
      transactions, setTransactions, addTransaction, updateTransaction, deleteTransaction,
      currency, setCurrency,
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
