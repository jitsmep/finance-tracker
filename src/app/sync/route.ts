import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { db as prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const deviceId = searchParams.get("deviceId");

  if (!deviceId) {
    return new Response("Error: No deviceId provided in the URL.", { status: 400 });
  }

  let targetUserId = null;
  try {
    const device = await prisma.device.findUnique({
      where: { deviceId }
    });
    if (device) {
      targetUserId = device.userId;
    }
  } catch (e) {
    console.error("Sync device error:", e);
    return new Response("Error: Failed to process sync.", { status: 500 });
  }

  if (targetUserId) {
    const cookieStore = await cookies();
    cookieStore.set("userId", targetUserId, { path: "/", maxAge: 31536000 });
    // Clear any existing profileId so the user can select their profile
    cookieStore.delete("profileId");
    
    // redirect to dashboard
    redirect("/");
  } else {
    return new Response("Error: Device ID not found or not registered yet.", { status: 404 });
  }
}
