import { ThemeSettings } from "@/components/ThemeSettings";

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your app preferences and account details.</p>
      </div>

      {/* This renders the interactive theme buttons we built! */}
      <ThemeSettings />

    </div>
  );
}
