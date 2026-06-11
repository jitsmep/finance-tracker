import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

// Clean, single imports for your providers
import { ThemeProvider } from "@/components/ThemeProvider"
import { FinanceProvider } from "@/components/FinanceProvider"

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Finance Tracker — Personal Budget & Expense Manager",
  description: "Track your income, expenses, and budgets.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-300">
        
        {/* 1. Theme Engine handles Dark/Light mode */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          
          {/* 2. Finance Engine handles Local Storage Data */}
          <FinanceProvider>
            {children}
          </FinanceProvider>

        </ThemeProvider>
        
      </body>
    </html>
  )
}
