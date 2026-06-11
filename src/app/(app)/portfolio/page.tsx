import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const prisma = new PrismaClient();
  
  // 1. Fetch the data from your new Neon tables
  const assets = await prisma.asset.findMany();
  const liabilities = await prisma.liability.findMany();
  const stocks = await prisma.stockPortfolio.findMany();

  // 2. Calculate the Math automatically
  const totalAssets = assets.reduce((sum, item) => sum + item.value, 0);
  const totalLiabilities = liabilities.reduce((sum, item) => sum + item.amount, 0);
  const totalStocks = stocks.reduce((sum, item) => sum + (item.shares * item.buyPrice), 0);
  const netWorth = (totalAssets + totalStocks) - totalLiabilities;

  // 3. Server Actions (Allows you to save data without refreshing)
  async function addAsset(formData: FormData) {
    "use server";
    const prisma = new PrismaClient();
    await prisma.asset.create({
      data: {
        name: formData.get("name") as string,
        value: parseFloat(formData.get("value") as string),
        type: formData.get("type") as string,
      }
    });
    revalidatePath("/portfolio");
  }

  async function addLiability(formData: FormData) {
    "use server";
    const prisma = new PrismaClient();
    await prisma.liability.create({
      data: {
        name: formData.get("name") as string,
        amount: parseFloat(formData.get("amount") as string),
        interest: parseFloat(formData.get("interest") as string) || 0,
      }
    });
    revalidatePath("/portfolio");
  }

  async function addStock(formData: FormData) {
    "use server";
    const prisma = new PrismaClient();
    await prisma.stockPortfolio.create({
      data: {
        ticker: (formData.get("ticker") as string).toUpperCase(),
        shares: parseFloat(formData.get("shares") as string),
        buyPrice: parseFloat(formData.get("buyPrice") as string),
      }
    });
    revalidatePath("/portfolio");
  }

  return (
    
      {/* Net Worth Hero Section */}
      
        Total Net Worth
        
          ${netWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        
        
          Assets: ${totalAssets.toLocaleString()}
          Stocks: ${totalStocks.toLocaleString()}
          Liabilities: -${totalLiabilities.toLocaleString()}
        
      

      {/* Input Grid */}
      
        
        {/* Asset Card */}
        
          Add Asset 🏠
          
            
            
            
              Cash
              Real Estate
              Vehicle
              Other
            
            Save Asset
          
        

        {/* Liability Card */}
        
          Add Liability 💳
          
            
            
            
            Save Liability
          
        

        {/* Stock Card */}
        
          Add Stock 📈
          
            
            
            
            Save Stock
          
        
        
      
    
  );
}
