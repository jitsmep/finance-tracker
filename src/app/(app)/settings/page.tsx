export const dynamic = "force-dynamic";
import { getSettings } from "@/lib/actions/settings"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CURRENCIES } from "@/lib/utils"
import { CurrencySelector } from "./currency-selector"

export default async function SettingsPage() {
  const settings = await getSettings()

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage your preferences</p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">Currency</CardTitle>
          <CardDescription>
            Select the currency to display throughout the app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CurrencySelector
            currentCode={settings.currencyCode}
            currencies={CURRENCIES as unknown as { code: string; symbol: string; name: string }[]}
          />
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Finance Tracker v1.0.0</p>
          <p>Built with Next.js, Prisma, and Recharts</p>
          <p>All data is stored locally in a SQLite database.</p>
        </CardContent>
      </Card>
    </div>
  )
}
