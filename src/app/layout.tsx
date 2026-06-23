import type { Metadata } from "next"
import { FinanceProvider } from "@/components/FinanceProvider"
import { Inter } from "next/font/google"
import "./globals.css"
// AuthGate disabled – kept for future use
import { ThemeProvider } from "@/components/ThemeProvider"
import { cookies } from "next/headers"

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Finance Tracker — Personal Budget & Expense Manager",
  description:
    "Track your income, expenses, and budgets with beautiful charts and insights. Stay on top of your personal finances.",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const userId = cookieStore.get("userId")?.value || null
  const profileId = cookieStore.get("profileId")?.value || null

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
            <FinanceProvider>{children}</FinanceProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
