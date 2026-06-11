import { PrismaClient } from "@prisma/client"

const DEFAULT_CATEGORIES = [
  { name: "Housing", icon: "🏠", isDefault: true },
  { name: "Food", icon: "🍕", isDefault: true },
  { name: "Transport", icon: "🚗", isDefault: true },
  { name: "Entertainment", icon: "🎬", isDefault: true },
  { name: "Utilities", icon: "⚡", isDefault: true },
  { name: "Health", icon: "💊", isDefault: true },
  { name: "Shopping", icon: "🛍️", isDefault: true },
  { name: "Education", icon: "📚", isDefault: true },
  { name: "Salary", icon: "💰", isDefault: true },
  { name: "Freelance", icon: "💻", isDefault: true },
  { name: "Investment", icon: "📈", isDefault: true },
  { name: "Other", icon: "📌", isDefault: true },
]

const prisma = new PrismaClient()

// The master PIN/Device ID for our seed data
const DEFAULT_DEVICE_ID = "system-default"

async function main() {
  console.log("🌱 Seeding database...")

  // 1. Seed Categories with the deviceId
  for (const cat of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { 
        deviceId_name: {
          deviceId: DEFAULT_DEVICE_ID,
          name: cat.name
        }
      },
      update: {},
      create: {
        ...cat,
        deviceId: DEFAULT_DEVICE_ID
      },
    })
  }

  // 2. Create default settings
  await prisma.settings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", currencyCode: "USD" },
  })

  // 3. Fetch categories specifically for our default device
  const categories = await prisma.category.findMany({
    where: { deviceId: DEFAULT_DEVICE_ID }
  })
  
  const salaryCategory = categories.find((c) => c.name === "Salary")
  const foodCategory = categories.find((c) => c.name === "Food")
  const transportCategory = categories.find((c) => c.name === "Transport")
  const entertainmentCategory = categories.find((c) => c.name === "Entertainment")
  const housingCategory = categories.find((c) => c.name === "Housing")
  const utilitiesCategory = categories.find((c) => c.name === "Utilities")
  const shoppingCategory = categories.find((c) => c.name === "Shopping")
  const freelanceCategory = categories.find((c) => c.name === "Freelance")

  const now = new Date()
  
  // 4. Add deviceId to all sample transactions
  const sampleTransactions = [
    { deviceId: DEFAULT_DEVICE_ID, type: "income", amount: 5000, date: new Date(now.getFullYear(), now.getMonth(), 1), note: "Monthly salary", categoryId: salaryCategory!.id },
    { deviceId: DEFAULT_DEVICE_ID, type: "expense", amount: 1200, date: new Date(now.getFullYear(), now.getMonth(), 2), note: "Rent payment", categoryId: housingCategory!.id },
    { deviceId: DEFAULT_DEVICE_ID, type: "expense", amount: 85, date: new Date(now.getFullYear(), now.getMonth(), 3), note: "Grocery shopping", categoryId: foodCategory!.id },
    { deviceId: DEFAULT_DEVICE_ID, type: "expense", amount: 45, date: new Date(now.getFullYear(), now.getMonth(), 4), note: "Gas fill up", categoryId: transportCategory!.id },
    { deviceId: DEFAULT_DEVICE_ID, type: "expense", amount: 120, date: new Date(now.getFullYear(), now.getMonth(), 5), note: "Electricity bill", categoryId: utilitiesCategory!.id },
    { deviceId: DEFAULT_DEVICE_ID, type: "expense", amount: 35, date: new Date(now.getFullYear(), now.getMonth(), 6), note: "Movie tickets", categoryId: entertainmentCategory!.id },
    { deviceId: DEFAULT_DEVICE_ID, type: "expense", amount: 200, date: new Date(now.getFullYear(), now.getMonth(), 7), note: "New shoes", categoryId: shoppingCategory!.id },
    { deviceId: DEFAULT_DEVICE_ID, type: "expense", amount: 65, date: new Date(now.getFullYear(), now.getMonth(), 8), note: "Restaurant dinner", categoryId: foodCategory!.id },
    { deviceId: DEFAULT_DEVICE_ID, type: "income", amount: 800, date: new Date(now.getFullYear(), now.getMonth(), 10), note: "Freelance project", categoryId: freelanceCategory!.id },
    { deviceId: DEFAULT_DEVICE_ID, type: "expense", amount: 150, date: new Date(now.getFullYear(), now.getMonth(), 12), note: "Internet & phone", categoryId: utilitiesCategory!.id },
    // Previous month data
    { deviceId: DEFAULT_DEVICE_ID, type: "income", amount: 5000, date: new Date(now.getFullYear(), now.getMonth() - 1, 1), note: "Monthly salary", categoryId: salaryCategory!.id },
    { deviceId: DEFAULT_DEVICE_ID, type: "expense", amount: 1200, date: new Date(now.getFullYear(), now.getMonth() - 1, 2), note: "Rent payment", categoryId: housingCategory!.id },
    { deviceId: DEFAULT_DEVICE_ID, type: "expense", amount: 350, date: new Date(now.getFullYear(), now.getMonth() - 1, 5), note: "Groceries", categoryId: foodCategory!.id },
    { deviceId: DEFAULT_DEVICE_ID, type: "expense", amount: 90, date: new Date(now.getFullYear(), now.getMonth() - 1, 8), note: "Bus pass", categoryId: transportCategory!.id },
    { deviceId: DEFAULT_DEVICE_ID, type: "expense", amount: 200, date: new Date(now.getFullYear(), now.getMonth() - 1, 15), note: "Clothes", categoryId: shoppingCategory!.id },
    // Two months ago
    { deviceId: DEFAULT_DEVICE_ID, type: "income", amount: 5000, date: new Date(now.getFullYear(), now.getMonth() - 2, 1), note: "Monthly salary", categoryId: salaryCategory!.id },
    { deviceId: DEFAULT_DEVICE_ID, type: "expense", amount: 1200, date: new Date(now.getFullYear(), now.getMonth() - 2, 2), note: "Rent", categoryId: housingCategory!.id },
    { deviceId: DEFAULT_DEVICE_ID, type: "expense", amount: 400, date: new Date(now.getFullYear(), now.getMonth() - 2, 10), note: "Groceries", categoryId: foodCategory!.id },
    { deviceId: DEFAULT_DEVICE_ID, type: "expense", amount: 75, date: new Date(now.getFullYear(), now.getMonth() - 2, 14), note: "Gas", categoryId: transportCategory!.id },
  ]

  // Clear old transactions to prevent stacking duplicates on re-seeds
  await prisma.transaction.deleteMany({
    where: { deviceId: DEFAULT_DEVICE_ID }
  })

  for (const tx of sampleTransactions) {
    await prisma.transaction.create({ data: tx })
  }

  // 5. Add deviceId to sample budgets
  const budgetData = [
    { deviceId: DEFAULT_DEVICE_ID, categoryId: housingCategory!.id, limit: 1500, month: now.getMonth() + 1, year: now.getFullYear() },
    { deviceId: DEFAULT_DEVICE_ID, categoryId: foodCategory!.id, limit: 500, month: now.getMonth() + 1, year: now.getFullYear() },
    { deviceId: DEFAULT_DEVICE_ID, categoryId: transportCategory!.id, limit: 200, month: now.getMonth() + 1, year: now.getFullYear() },
    { deviceId: DEFAULT_DEVICE_ID, categoryId: entertainmentCategory!.id, limit: 150, month: now.getMonth() + 1, year: now.getFullYear() },
    { deviceId: DEFAULT_DEVICE_ID, categoryId: utilitiesCategory!.id, limit: 300, month: now.getMonth() + 1, year: now.getFullYear() },
    { deviceId: DEFAULT_DEVICE_ID, categoryId: shoppingCategory!.id, limit: 400, month: now.getMonth() + 1, year: now.getFullYear() },
  ]

  for (const budget of budgetData) {
    // Note: If you made a compound key for Budgets like `deviceId_categoryId_month_year`, this upsert might need a slight tweak, but standard Prisma allows finding by unique IDs. Assuming your schema is standard here!
    
    // Fallback: Just delete and recreate to be safe and avoid compound key issues on seed
    await prisma.budget.deleteMany({
      where: {
        deviceId: budget.deviceId,
        categoryId: budget.categoryId,
        month: budget.month,
        year: budget.year,
      }
    })
    await prisma.budget.create({ data: budget })
  }

  console.log("✅ Database seeded successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
