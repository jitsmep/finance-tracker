import { formatCurrency } from "@/lib/utils";
import { Building2, CreditCard, TrendingUp, Wallet } from "lucide-react";

export default async function PortfolioPage() {
  // 1. Fetch your data here (Make sure to pull Settings to get the currency!)
  // const settings = await getSettings(); 
  // const currency = settings?.currencyCode || "USD";
  
  // For demonstration, assuming these are fetched:
  const currency = "EUR"; // Try changing this to "GBP", "JPY", or "INR"!
  const netWorth = 125000;
  const assets = 85000;
  const portfolio = 50000;
  const debt = 10000;

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Portfolio Management</h1>
        <p className="text-gray-500 mt-1">Track and manage your assets, liabilities, and equities.</p>
      </div>

      {/* --- TOP STAT CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Worth (Highlighted) */}
        <div className="bg-emerald-600 text-white p-6 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-emerald-100 text-sm font-medium uppercase tracking-wider mb-1">Net Worth</p>
              <h2 className="text-3xl font-bold">{formatCurrency(netWorth, currency)}</h2>
            </div>
            <div className="p-2 bg-emerald-500/50 rounded-lg"><Wallet className="w-6 h-6" /></div>
          </div>
          <p className="text-emerald-200 text-xs mt-4 flex items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-300 mr-2 animate-pulse"></span>
            Fully Synchronized
          </p>
        </div>

        {/* Assets */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">Fixed Assets</p>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(assets, currency)}</h2>
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg"><Building2 className="w-6 h-6" /></div>
          </div>
        </div>

        {/* Portfolio */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">Equities</p>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(portfolio, currency)}</h2>
            </div>
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg"><TrendingUp className="w-6 h-6" /></div>
          </div>
        </div>

        {/* Debt */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">Outstanding Debt</p>
              <h2 className="text-3xl font-bold text-red-600 dark:text-red-400">{formatCurrency(debt, currency)}</h2>
            </div>
            <div className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg"><CreditCard className="w-6 h-6" /></div>
          </div>
        </div>
      </div>

      {/* --- INPUT FORMS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Asset Form */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Building2 className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-lg">Add Asset</h3>
          </div>
          <form className="space-y-4">
            <input type="text" placeholder="Asset Name" className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
            <input type="number" placeholder={`Valuation (${currency})`} className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
            <button className="w-full py-3 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-gray-900 text-white rounded-lg font-medium transition-colors">
              Commit Asset
            </button>
          </form>
        </div>

        {/* Liability Form */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <CreditCard className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-lg">Add Liability</h3>
          </div>
          <form className="space-y-4">
            <input type="text" placeholder="Debt Title" className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-red-500 outline-none transition-all" />
            <input type="number" placeholder={`Principal (${currency})`} className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-red-500 outline-none transition-all" />
            <button className="w-full py-3 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-gray-900 text-white rounded-lg font-medium transition-colors">
              Commit Liability
            </button>
          </form>
        </div>

        {/* Equity Form */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-lg">Add Equity</h3>
          </div>
          <form className="space-y-4">
            <input type="text" placeholder="Ticker Symbol (e.g. AAPL)" className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none transition-all" />
            <input type="number" placeholder={`Cost Basis (${currency})`} className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none transition-all" />
            <button className="w-full py-3 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-gray-900 text-white rounded-lg font-medium transition-colors">
              Commit Equity
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
