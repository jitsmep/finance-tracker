import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (id) {
    // 🚀 Securely set the cookie in an API Route
    const cookieStore = await cookies();
    cookieStore.set("deviceId", id, { path: "/", maxAge: 31536000 });
    
    // Send the user back to the dashboard!
    redirect("/");
  }

  return new Response("Error: No Sync ID provided in the URL.", { status: 400 });
}
