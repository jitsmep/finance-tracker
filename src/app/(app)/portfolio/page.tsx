import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const prisma = new PrismaClient();
  
  // 1. Fetch data from Neon tables safely
  const assets = await prisma.asset.findMany().catch(() => []);
  const liabilities = await prisma.liability.findMany().catch(() => []);
  const stocks = await prisma.stockPortfolio.findMany().catch(() => []);

  // 2. Run calculations
  const totalAssets = assets.reduce((sum, item) => sum + item.value, 0);
  const totalLiabilities = liabilities.reduce((sum, item) => sum + item.amount, 0);
  const totalStocks = stocks.reduce((sum, item) => sum + (item.shares * item.buyPrice), 0);
  const netWorth = (totalAssets + totalStocks) - totalLiabilities;

  // 3. Server Actions for forms
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
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Net Worth Hero Section */}
      <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl flex flex-col items-center justify-center">
        <h1 className="text-slate-400 text-sm font-semibold tracking-widest uppercase mb-2">
          {"Total Net Worth"}
        </h1>
        <p className="text-6xl font-bold tracking-tight">
          {"$"}{netWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <div className="flex flex-wrap gap-4 mt-6 text-sm text-slate-300 justify-center">
          <span className="bg-slate-800 px-4 py-2 rounded-full border border-slate-700">
            {"Assets: $"}{totalAssets.toLocaleString()}
          </span>
          <span className="bg-slate-800 px-4 py-2 rounded-full border border-slate-700">
            {"Stocks: $"}{totalStocks.toLocaleString()}
          </span>
          <span className="bg-slate-800 px-4 py-2 rounded-full border border-slate-700 text-red-400">
            {"Liabilities: -$"}{totalLiabilities.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Input Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Asset Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold mb-4 text-slate-800">{"Add Asset 🏠"}</h2>
          <form action={addAsset} className="space-y-4">
            <input name="name" placeholder="e.g. Savings Account" required className="w-full p-3 border rounded-lg bg-slate-50 text-slate-900" />
            <input name="value" type="number" step="0.01" placeholder="Value ($)" required className="w-full p-3 border rounded-lg bg-slate-50 text-slate-900" />
            <select name="type" className="w-full p-3 border rounded-lg bg-slate-50 text-slate-900">
              <option value="Cash">{"Cash"}</option>
              <option value="Real Estate">{"Real Estate"}</option>
              <option value="Vehicle">{"Vehicle"}</option>
              <option value="Other">{"Other"}</option>
            </select>
            <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition">
              {"Save Asset"}
            </button>
          </form>
        </div>

        {/* Liability Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold mb-4 text-slate-800">{"Add Liability 💳"}</h2>
          <form action={addLiability} className="space-y-4">
            <input name="name" placeholder="e.g. Car Loan" required className="w-full p-3 border rounded-lg bg-slate-50 text-slate-900" />
            <input name="amount" type="number" step="0.01" placeholder="Amount Owed ($)" required className="w-full p-3 border rounded-lg bg-slate-50 text-slate-900" />
            <input name="interest" type="number" step="0.01" placeholder="Interest Rate % (Optional)" className="w-full p-3 border rounded-lg bg-slate-50 text-slate-900" />
            <button type="submit" className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition">
              {"Save Liability"}
            </button>
          </form>
        </div>

        {/* Stock Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold mb-4 text-slate-800">{"Add Stock 📈"}</h2>
          <form action={addStock} className="space-y-4">
            <input name="ticker" placeholder="Ticker (e.g. AAPL)" required className="w-full p-3 border rounded-lg uppercase bg-slate-50 text-slate-900" />
            <input name="shares" type="number" step="0.01" placeholder="Number of Shares" required className="w-full p-3 border rounded-lg bg-slate-50 text-slate-900" />
            <input name="buyPrice" type="number" step="0.01" placeholder="Avg Price Paid ($)" required className="w-full p-3 border rounded-lg bg-slate-50 text-slate-900" />
            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition">
              {"Save Stock"}
            </button>
          </form>
        </div>
        
      </div>
    </div>
  );
}
