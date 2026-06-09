"use client"

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, type CurrencyCode } from "@/lib/utils"

interface Props {
  trends: { month: string; income: number; expenses: number; savings: number }[]
  categoryData: { name: string; value: number; icon: string }[]
  currency: CurrencyCode
}

export function AnalyticsCharts({ trends, categoryData, currency }: Props) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-xl p-3 shadow-lg text-xs space-y-1">
          <p className="font-semibold text-foreground">{label}</p>
          {payload.map((entry: any) => (
            <p key={entry.name} style={{ color: entry.color || entry.stroke }}>
              {entry.name}: {formatCurrency(entry.value, currency)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-4">
      {/* Area Chart - Income vs Expenses */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">Income vs Expenses Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trends}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.696 0.17 162)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.696 0.17 162)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.637 0.237 25)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.637 0.237 25)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.015 285 / 0.5)" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "oklch(0.61 0.02 285)", fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "oklch(0.61 0.02 285)", fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="income" name="Income" stroke="oklch(0.696 0.17 162)" fill="url(#incomeGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="expenses" name="Expenses" stroke="oklch(0.637 0.237 25)" fill="url(#expenseGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Line Chart - Savings */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">Monthly Savings</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.015 285 / 0.5)" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "oklch(0.61 0.02 285)", fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "oklch(0.61 0.02 285)", fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="savings"
                name="Savings"
                stroke="oklch(0.696 0.17 162)"
                strokeWidth={2.5}
                dot={{ fill: "oklch(0.696 0.17 162)", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
