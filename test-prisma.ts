import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  try {
    const user = await prisma.user.create({
      data: { email: `test_${Date.now()}@test.com`, password: "password123" }
    })
    console.log("Success:", user)
  } catch (err) {
    console.error("Prisma error:", err)
  }
}
main()
