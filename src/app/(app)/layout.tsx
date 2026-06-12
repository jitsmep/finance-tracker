export const dynamic = "force-dynamic";
import { Sidebar } from "@/components/sidebar"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      {/* pb-20 on mobile for fixed bottom nav, md:pb-0 on desktop */}
      <main className="flex-1 overflow-auto bg-background pb-20 md:pb-0">
        {children}
      </main>
    </div>
  )
}
