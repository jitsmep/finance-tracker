import { getSettings, updateCurrency } from "@/lib/actions/settings";
import { revalidatePath } from "next/cache";
import { ThemeSettings } from "@/components/ThemeSettings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettings();

  // Server Action to save the currency to the database
  async function handleUpdateCurrency(formData: FormData) {
    "use server";
    const currencyCode = formData.get("currency") as string;
    await updateCurrency(currencyCode);
    revalidatePath("/settings");
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your app preferences and appearance.</p>
      </div>

      <div className="flex flex-col gap-6">
        
        {/* === SECTION 1: CURRENCY PREFERENCES === */}
        <div className="bg-card text-card-foreground border border-border p-6 rounded-2xl shadow-sm max-w-xl">
          <div className="mb-6">
            <h3 className="text-lg font-bold">Preferences</h3>
            <p className="text-sm text-muted-foreground">Manage your default currency and localization.</p>
          </div>
          <form action={handleUpdateCurrency} className="flex flex-col gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Default Currency</label>
              <select 
                name="currency" 
                defaultValue={settings.currencyCode} 
                className="w-full p-3 border border-input rounded-xl bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
                <option value="INR">INR (₹) - Indian Rupee</option>
                <option value="JPY">JPY (¥) - Japanese Yen</option>
                <option value="CAD">CAD ($) - Canadian Dollar</option>
                <option value="AUD">AUD ($) - Australian Dollar</option>
              </select>
            </div>
            <button type="submit" className="bg-primary text-primary-foreground text-sm font-bold py-3 px-6 rounded-xl hover:opacity-90 transition w-full sm:w-auto self-start shadow-sm tracking-wide">
              Save Preferences
            </button>
          </form>
        </div>

        {/* === SECTION 2: THEME SETTINGS === */}
        <ThemeSettings />

      </div>
    </div>
  );
}
