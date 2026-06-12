import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { PinGate } from "@/components/pin-gate"
import { ThemeProvider } from "@/components/ThemeProvider"

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
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PinGate>{children}</PinGate>
        </ThemeProvider>
      </body>
    </html>
  )
}
