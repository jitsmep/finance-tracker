import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

// 1. Import our new Theme pieces
import { ThemeProvider } from "@/components/ThemeProvider"
import { ThemeToggle } from "@/components/ThemeToggle"

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // 2. MUST add suppressHydrationWarning to the html tag for next-themes
    <html lang="en" suppressHydrationWarning className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-300">
        
        {/* 3. Wrap the app in the ThemeProvider */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          
          {/* 4. A floating Theme Toggle button fixed to the bottom right! */}
          <div className="fixed bottom-6 right-6 z-50 shadow-2xl rounded-full">
            <ThemeToggle />
          </div>

          {/* This renders your actual pages */}
          {children}

        </ThemeProvider>
        
      </body>
    </html>
  )
}
