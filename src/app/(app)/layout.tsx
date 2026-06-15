export const dynamic = "force-dynamic";
import { Sidebar } from "@/components/sidebar"
import { cookies } from "next/headers"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const layoutPref = cookieStore.get("nav_layout")?.value || "sidebar"
  const isSidebar = layoutPref === "sidebar"
  
  return (
    <div className={`min-h-screen ${isSidebar ? 'flex' : 'flex flex-col'}`}>
      <Sidebar layout={layoutPref as any} />
      {/* pb-24 on mobile for fixed bottom nav, md:pb-0 on desktop unless bottom nav is active */}
      <main className={`flex-1 overflow-auto bg-background pb-24 ${layoutPref === 'bottom' ? 'md:pb-28' : 'md:pb-0'}`}>
        {children}
      </main>
    </div>
  )
}
