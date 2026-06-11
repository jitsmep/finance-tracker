import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function AdvancedPortfolioPage() {
  const prisma = new PrismaClient();
  
  // 1. Unified Database Fetching
  const assets = await prisma.asset.findMany().catch(() => []);
  const liabilities = await prisma.liability.findMany().catch(() => []);
  const stocks = await prisma.stockPortfolio.findMany().catch(() => []);

  // 2. Real-Time Math Synchronizations
  const totalAssets = assets.reduce((sum, item) => sum + item.value, 0);
  const totalLiabilities = liabilities.reduce((sum, item) => sum + item.amount, 0);
  const totalStocks = stocks.reduce((sum, item) => sum + (item.shares * item.buyPrice), 0);
  const totalWealth = totalAssets + totalStocks;
  const netWorth = totalWealth - totalLiabilities;
  const debtToAssetRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;

  // 3. Secure Server Mutations
  async function addAsset(formData: FormData) {
    "use server";
    const p = new PrismaClient();
    await p.asset.create({
      data: {
        name: formData.get("name") as string,
        value: parseFloat(formData.get("value") as string) || 0,
        type: formData.get("type") as string || "Other",
      }
    });
    revalidatePath("/portfolio");
  }

  async function addLiability(formData: FormData) {
    "use server";
    const p = new PrismaClient();
    await p.liability.create({
      data: {
        name: formData.get("name") as string,
        amount: parseFloat(formData.get("amount") as string) || 0,
        interest: parseFloat(formData.get("interest") as string) || 0,
      }
    });
    revalidatePath("/portfolio");
  }

  async function addStock(formData: FormData) {
    "use server";
    const p = new PrismaClient();
    await p.stockPortfolio.create({
      data: {
        ticker: (formData.get("ticker") as string || "").toUpperCase(),
        shares: parseFloat(formData.get("shares") as string) || 0,
        buyPrice: parseFloat(formData.get("buyPrice") as string) || 0,
      }
    });
    revalidatePath("/portfolio");
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-8 bg-slate-50 min-h-screen text-slate-900">
      
      {/* Executive KPI Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm flex flex-col justify-between border border-slate-800">
          <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">{"Net Worth Balance"}</span>
          <h3 className="text-3xl font-bold mt-2">{"$"}{netWorth.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
          <span className="text-[10px] text-emerald-400 mt-4 flex items-center gap-1">{"● Fully Synchronized"}</span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">{"Fixed & Liquid Assets"}</span>
          <h3 className="text-3xl font-bold mt-2 text-slate-800">{"$"}{totalAssets.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
          <span className="text-[10px] text-slate-400 mt-4">{"Excluding Equities"}</span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">{"Stock Portfolio Value"}</span>
          <h3 className="text-3xl font-bold mt-2 text-blue-600">{"$"}{totalStocks.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
          <span className="text-[10px] text-slate-400 mt-4">{"Total Capital Invested"}</span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">{"Outstanding Debt"}</span>
          <h3 className="text-3xl font-bold mt-2 text-red-600">{"$"}{totalLiabilities.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
          <span className="text-[10px] text-slate-400 mt-4">{"Leverage Ratio: "}{debtToAssetRatio.toFixed(1)}{"%"}</span>
        </div>
      </div>

      {/* Advanced Data Entry Suite */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset Capture */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4 border-b pb-2">
            <span className="text-xl">{"🏠"}</span>
            <h4 className="font-bold text-slate-800">{"Asset Ledger"}</h4>
          </div>
          <form action={addAsset} className="space-y-3">
            <input name="name" placeholder="Asset Identifier (e.g. Cash)" required className="w-full text-sm p-3 border rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400" />
            <input name="value" type="number" step="0.01" placeholder="Current Appraisal Value ($)" required className="w-full text-sm p-3 border rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400" />
            <select name="type" className="w-full text-sm p-3 border rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400">
              <option value="Cash">{"Liquid Cash"}</option>
              <option value="Real Estate">{"Real Estate Property"}</option>
              <option value="Vehicle">{"Automobile / Transport"}</option>
              <option value="Other">{"Alternative Capital Assets"}</option>
            </select>
            <button type="submit" className="w-full bg-slate-900 text-white text-xs font-bold py-3 rounded-xl hover:bg-slate-800 transition shadow-sm tracking-wide">
              {"Commit Asset"}
            </button>
          </form>
        </div>

        {/* Debt Capture */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4 border-b pb-2">
            <span className="text-xl">{"💳"}</span>
            <h4 className="font-bold text-slate-800">{"Liability Ledger"}</h4>
          </div>
          <form action={addLiability} className="space-y-3">
            <input name="name" placeholder="Lender / Debt Title (e.g. Mortgage)" required className="w-full text-sm p-3 border rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400" />
            <input name="amount" type="number" step="0.01" placeholder="Outstanding Principal ($)" required className="w-full text-sm p-3 border rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400" />
            <input name="interest" type="number" step="0.01" placeholder="Annual Percentage Rate % (APR)" className="w-full text-sm p-3 border rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400" />
            <button type="submit" className="w-full bg-red-600 text-white text-xs font-bold py-3 rounded-xl hover:bg-red-700 transition shadow-sm tracking-wide">
              {"Commit Liability"}
            </button>
          </form>
        </div>

        {/* Portfolio Capture */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4 border-b pb-2">
            <span className="text-xl">{"📈"}</span>
            <h4 className="font-bold text-slate-800">{"Equity Portfolio"}</h4>
          </div>
          <form action={addStock} className="space-y-3">
            <input name="ticker" placeholder="Market Symbol (e.g. NVDA)" required className="w-full text-sm p-3 border rounded-xl bg-slate-50 text-slate-900 uppercase focus:outline-none focus:ring-1 focus:ring-slate-400" />
            <input name="shares" type="number" step="0.0001" placeholder="Volume (Total Shares Owned)" required className="w-full text-sm p-3 border rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400" />
            <input name="buyPrice" type="number" step="0.01" placeholder="Average Cost Basis ($)" required className="w-full text-sm p-3 border rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400" />
            <button type="submit" className="w-full bg-blue-600 text-white text-xs font-bold py-3 rounded-xl hover:bg-blue-700 transition shadow-sm tracking-wide">
              {"Commit Equity Record"}
            </button>
          </form>
        </div>
      </div>

      {/* Holistic Itemized Asset Tables */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h4 className="font-bold text-slate-800">{"Itemized Holdings Statement"}</h4>
          <p className="text-xs text-slate-500">{"Granular breakdown of database accounts synchronized with master parameters."}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b">
              <tr>
                <th className="p-4">{"Holding Name / Asset Class"}</th>
                <th className="p-4">{"Holding Type"}</th>
                <th className="p-4 text-right">{"Current Valuation"}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {assets.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 font-medium text-slate-900">{item.name}</td>
                  <td className="p-4"><span className="bg-slate-100 text-slate-700 text-[11px] px-2 py-1 rounded-md font-medium">{item.type}</span></td>
                  <td className="p-4 text-right font-semibold text-slate-900">{"$"}{item.value.toLocaleString()}</td>
                </tr>
              ))}
              {stocks.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 font-medium text-slate-900">{item.ticker} <span className="text-xs text-slate-400 font-normal">{"("}{item.shares}{" Units)"}</span></td>
                  <td className="p-4"><span className="bg-blue-50 text-blue-700 text-[11px] px-2 py-1 rounded-md font-medium">{"Public Equity"}</span></td>
                  <td className="p-4 text-right font-semibold text-blue-600">{"$"}{(item.shares * item.buyPrice).toLocaleString()}</td>
                </tr>
              ))}
              {liabilities.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 font-medium text-slate-900">{item.name} {item.interest ? <span className="text-xs text-red-400">{"@"}{item.interest}{"%"}</span> : null}</td>
                  <td className="p-4"><span className="bg-red-50 text-red-700 text-[11px] px-2 py-1 rounded-md font-medium">{"Liability"}</span></td>
                  <td className="p-4 text-right font-semibold text-red-600">{"-$"}{item.amount.toLocaleString()}</td>
                </tr>
              ))}
              {assets.length === 0 && stocks.length === 0 && liabilities.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-slate-400 text-xs">{"No asset ledger data detected. Populate the records above to sync inputs."}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
