"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// 1. Define the shape of your data
export type Category = { id: string; name: string; icon: string; isDefault: boolean };
export type Transaction = { id: string; type: string; amount: number; date: string; note: string; categoryId: string };

type FinanceContextType = {
  categories: Category[];
  setCategories: (cats: Category[]) => void;
  transactions: Transaction[];
  setTransactions: (txs: Transaction[]) => void;
};

// 2. Create the empty brain
const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

// 3. Create the Engine that runs the brain
export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [mounted, setMounted] = useState(false);

  // When the app first opens, pull everything from the browser's memory
  useEffect(() => {
    const savedCats = JSON.parse(localStorage.getItem("finance_categories") || "[]");
    const savedTxs = JSON.parse(localStorage.getItem("finance_transactions") || "[]");
    
    // If they have no categories at all, let's inject our magic defaults!
    if (savedCats.length === 0) {
      const defaultCats = [
        { id: "1", name: "Salary", icon: "💰", isDefault: true },
        { id: "2", name: "Groceries", icon: "🛒", isDefault: true },
        { id: "3", name: "Rent / EMI", icon: "🏠", isDefault: true },
        { id: "4", name: "Petrol & Transit", icon: "🚗", isDefault: true },
      ];
      setCategories(defaultCats);
    } else {
      setCategories(savedCats);
    }
    
    setTransactions(savedTxs);
    setMounted(true);
  }, []);

  // Whenever a category or transaction changes, save it instantly to browser memory
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("finance_categories", JSON.stringify(categories));
      localStorage.setItem("finance_transactions", JSON.stringify(transactions));
    }
  }, [categories, transactions, mounted]);

  // Prevent hydration flashing
  if (!mounted) {
    return <div className="min-h-screen flex items-center justify-center animate-pulse">Loading local vault...</div>;
  }

  return (
    <FinanceContext.Provider value={{ categories, setCategories, transactions, setTransactions }}>
      {children}
    </FinanceContext.Provider>
  );
}

// 4. Create a quick shortcut so your pages can talk to the Engine easily
export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) throw new Error("useFinance must be used within a FinanceProvider");
  return context;
}
