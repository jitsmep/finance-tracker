import { getSettings, updateCurrency } from "@/lib/actions/settings";
import { revalidatePath } from "next/cache";
import { ThemeSettings } from "@/components/ThemeSettings";
import { ChangePinForm } from "@/components/ChangePinForm";
import { ExportData } from "@/components/export-data";
import { Settings2, Palette, Database, Info, Globe } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettings();

  async function handleUpdateCurrency(formData: FormData) {
    "use server";
    const currencyCode = formData.get("currency") as string;
    await updateCurrency(currencyCode);
    revalidatePath("/settings");
  }

  const currencies = [
    { code: "USD", label: "USD ($) — US Dollar" },
    { code: "EUR", label: "EUR (€) — Euro" },
    { code: "GBP", label: "GBP (£) — British Pound" },
    { code: "INR", label: "INR (₹) — Indian Rupee" },
    { code: "JPY", label: "JPY (¥) — Japanese Yen" },
    { code: "CAD", label: "CAD ($) — Canadian Dollar" },
    { code: "AUD", label: "AUD ($) — Australian Dollar" },
    { code: "SGD", label: "SGD ($) — Singapore Dollar" },
    { code: "AED", label: "AED (د.إ) — UAE Dirham" },
  ];

  return (
    <div className="p-4 sm:p-6 pb-24 md:pb-8 max-w-2xl mx-auto space-y-8 animate-fade-in">

      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your app preferences and security.</p>
      </div>

      {/* ── SECTION 1: PREFERENCES ── */}
      <section className="space-y-3">
        <SectionHeader icon={<Settings2 className="w-4 h-4" />} label="Preferences" />
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <form action={handleUpdateCurrency}>
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  Default Currency
                </label>
                <select
                  name="currency"
                  defaultValue={settings.currencyCode}
                  className="w-full p-3 rounded-xl bg-secondary/40 border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                >
                  {currencies.map((c) => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="px-5 pb-5">
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-sm shadow-primary/20"
              >
                Save Preferences
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ── SECTION 2: APPEARANCE ── */}
      <section className="space-y-3">
        <SectionHeader icon={<Palette className="w-4 h-4" />} label="Appearance" />
        <ThemeSettings />
      </section>

      {/* ── SECTION 3: SECURITY ── */}
      <section className="space-y-3">
        <SectionHeader icon={<span className="text-sm">🔐</span>} label="Security" />
        <ChangePinForm />
      </section>

      {/* ── SECTION 4: DATA MANAGEMENT ── */}
      <section className="space-y-3">
        <SectionHeader icon={<Database className="w-4 h-4" />} label="Data Management" />
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm font-semibold text-foreground">Export Transactions</p>
                <p className="text-xs text-muted-foreground mt-0.5">Download all your transactions as a CSV file.</p>
              </div>
              <ExportData />
            </div>
            <div className="border-t border-border" />
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm font-semibold text-foreground">Storage Info</p>
                <p className="text-xs text-muted-foreground mt-0.5">Your data is stored securely on this device and our private server.</p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-xs font-semibold text-primary border border-primary/20">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Private & Secure
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 5: ABOUT ── */}
      <section className="space-y-3">
        <SectionHeader icon={<Info className="w-4 h-4" />} label="About" />
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 space-y-3">
            {[
              { label: "App Name", value: "Finance Tracker" },
              { label: "Version", value: "1.0.0" },
              { label: "Built With", value: "Next.js 15 + Prisma" },
              { label: "Theme", value: "Dynamic (Light / Dark)" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-1">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm font-semibold text-foreground">{value}</span>
              </div>
            ))}
          </div>
          <div className="px-5 py-4 border-t border-border bg-secondary/20">
            <p className="text-xs text-muted-foreground text-center">
              © 2025 Finance Tracker · Personal Finance Made Simple
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 px-1">
      <span className="text-muted-foreground">{icon}</span>
      <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</h2>
    </div>
  );
}
