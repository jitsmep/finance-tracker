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

async function main() {
  console.log("🌱 Seeding database...")

  for (const cat of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    })
  }

  // Create default settings
  await prisma.settings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", currencyCode: "USD" },
  })

  // Add sample transactions for demo
  const categories = await prisma.category.findMany()
  const salaryCategory = categories.find((c) => c.name === "Salary")
  const foodCategory = categories.find((c) => c.name === "Food")
  const transportCategory = categories.find((c) => c.name === "Transport")
  const entertainmentCategory = categories.find((c) => c.name === "Entertainment")
  const housingCategory = categories.find((c) => c.name === "Housing")
  const utilitiesCategory = categories.find((c) => c.name === "Utilities")
  const shoppingCategory = categories.find((c) => c.name === "Shopping")

  const now = new Date()
  const sampleTransactions = [
    { type: "income", amount: 5000, date: new Date(now.getFullYear(), now.getMonth(), 1), note: "Monthly salary", categoryId: salaryCategory!.id },
    { type: "expense", amount: 1200, date: new Date(now.getFullYear(), now.getMonth(), 2), note: "Rent payment", categoryId: housingCategory!.id },
    { type: "expense", amount: 85, date: new Date(now.getFullYear(), now.getMonth(), 3), note: "Grocery shopping", categoryId: foodCategory!.id },
    { type: "expense", amount: 45, date: new Date(now.getFullYear(), now.getMonth(), 4), note: "Gas fill up", categoryId: transportCategory!.id },
    { type: "expense", amount: 120, date: new Date(now.getFullYear(), now.getMonth(), 5), note: "Electricity bill", categoryId: utilitiesCategory!.id },
    { type: "expense", amount: 35, date: new Date(now.getFullYear(), now.getMonth(), 6), note: "Movie tickets", categoryId: entertainmentCategory!.id },
    { type: "expense", amount: 200, date: new Date(now.getFullYear(), now.getMonth(), 7), note: "New shoes", categoryId: shoppingCategory!.id },
    { type: "expense", amount: 65, date: new Date(now.getFullYear(), now.getMonth(), 8), note: "Restaurant dinner", categoryId: foodCategory!.id },
    { type: "income", amount: 800, date: new Date(now.getFullYear(), now.getMonth(), 10), note: "Freelance project", categoryId: categories.find((c) => c.name === "Freelance")!.id },
    { type: "expense", amount: 150, date: new Date(now.getFullYear(), now.getMonth(), 12), note: "Internet & phone", categoryId: utilitiesCategory!.id },
    // Previous month data
    { type: "income", amount: 5000, date: new Date(now.getFullYear(), now.getMonth() - 1, 1), note: "Monthly salary", categoryId: salaryCategory!.id },
    { type: "expense", amount: 1200, date: new Date(now.getFullYear(), now.getMonth() - 1, 2), note: "Rent payment", categoryId: housingCategory!.id },
    { type: "expense", amount: 350, date: new Date(now.getFullYear(), now.getMonth() - 1, 5), note: "Groceries", categoryId: foodCategory!.id },
    { type: "expense", amount: 90, date: new Date(now.getFullYear(), now.getMonth() - 1, 8), note: "Bus pass", categoryId: transportCategory!.id },
    { type: "expense", amount: 200, date: new Date(now.getFullYear(), now.getMonth() - 1, 15), note: "Clothes", categoryId: shoppingCategory!.id },
    // Two months ago
    { type: "income", amount: 5000, date: new Date(now.getFullYear(), now.getMonth() - 2, 1), note: "Monthly salary", categoryId: salaryCategory!.id },
    { type: "expense", amount: 1200, date: new Date(now.getFullYear(), now.getMonth() - 2, 2), note: "Rent", categoryId: housingCategory!.id },
    { type: "expense", amount: 400, date: new Date(now.getFullYear(), now.getMonth() - 2, 10), note: "Groceries", categoryId: foodCategory!.id },
    { type: "expense", amount: 75, date: new Date(now.getFullYear(), now.getMonth() - 2, 14), note: "Gas", categoryId: transportCategory!.id },
  ]

  for (const tx of sampleTransactions) {
    await prisma.transaction.create({ data: tx })
  }

  // Add sample budgets for current month
  const budgetData = [
    { categoryId: housingCategory!.id, limit: 1500, month: now.getMonth() + 1, year: now.getFullYear() },
    { categoryId: foodCategory!.id, limit: 500, month: now.getMonth() + 1, year: now.getFullYear() },
    { categoryId: transportCategory!.id, limit: 200, month: now.getMonth() + 1, year: now.getFullYear() },
    { categoryId: entertainmentCategory!.id, limit: 150, month: now.getMonth() + 1, year: now.getFullYear() },
    { categoryId: utilitiesCategory!.id, limit: 300, month: now.getMonth() + 1, year: now.getFullYear() },
    { categoryId: shoppingCategory!.id, limit: 400, month: now.getMonth() + 1, year: now.getFullYear() },
  ]

  for (const budget of budgetData) {
    await prisma.budget.upsert({
      where: {
        categoryId_month_year: {
          categoryId: budget.categoryId,
          month: budget.month,
          year: budget.year,
        },
      },
      update: {},
      create: budget,
    })
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
