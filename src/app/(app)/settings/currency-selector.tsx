"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateCurrency } from "@/lib/actions/settings"

interface CurrencySelectorProps {
  currentCode: string
  currencies: { code: string; symbol: string; name: string }[]
}

export function CurrencySelector({ currentCode, currencies }: CurrencySelectorProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleChange(code: string) {
    startTransition(async () => {
      await updateCurrency(code)
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-4">
      <Select value={currentCode} onValueChange={handleChange} disabled={isPending}>
        <SelectTrigger className="w-64" id="currency-selector">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {currencies.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              <span className="flex items-center gap-2">
                <span className="font-mono text-muted-foreground w-6 text-xs">{c.symbol}</span>
                <span>{c.code}</span>
                <span className="text-muted-foreground text-xs">— {c.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isPending && <span className="text-xs text-muted-foreground">Saving...</span>}
    </div>
  )
}
