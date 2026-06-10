export const dynamic = "force-dynamic";

// ... your existing imports and component code continue below
import { redirect } from "next/navigation"

export default function RootPage() {
  redirect("/dashboard")
}
