import { NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const deviceId = cookieStore.get("deviceId")?.value;

  if (!deviceId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const transactions = await prisma.transaction.findMany({
    where: { deviceId },
    include: { category: true },
    orderBy: { date: "desc" },
  });

  const rows = [
    ["Date", "Type", "Category", "Amount", "Note"],
    ...transactions.map((t) => [
      new Date(t.date).toLocaleDateString("en-US"),
      t.type,
      t.category.name,
      t.amount.toFixed(2),
      (t.note ?? "").replace(/,/g, ";"),
    ]),
  ];

  const csv = rows.map((r) => r.join(",")).join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="transactions.csv"`,
    },
  });
}
