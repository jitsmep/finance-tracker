import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function SyncPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;
  const id = params.id;

  if (id) {
    // 🚀 This stamps the phone with the laptop's ID!
    const cookieStore = await cookies();
    cookieStore.set("deviceId", id, { path: "/", maxAge: 31536000 });
    redirect("/"); // Sends you back to the dashboard
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-900">
      <p>Error: No Sync ID provided in the URL.</p>
    </div>
  );
}
