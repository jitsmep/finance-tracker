import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const SYNC_DIR = path.join(process.cwd(), "src", "data", "syncs");
const memorySyncCache = new Map<string, any>();

async function ensureDir() {
  try {
    await fs.mkdir(SYNC_DIR, { recursive: true });
  } catch (e) {
    // Ignore error
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get("deviceId");

  if (!deviceId) {
    return NextResponse.json({ error: "Device ID is required" }, { status: 400 });
  }

  // 1. Try memory cache first
  if (memorySyncCache.has(deviceId)) {
    return NextResponse.json(memorySyncCache.get(deviceId));
  }

  // 2. Try file system
  try {
    const filePath = path.join(SYNC_DIR, `${deviceId}.json`);
    const fileContent = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(fileContent);
    memorySyncCache.set(deviceId, data); // load into memory
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Sync data not found" }, { status: 404 });
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get("deviceId");

  if (!deviceId) {
    return NextResponse.json({ error: "Device ID is required" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { categories, transactions, currency } = body;

    const payload = {
      categories: categories || [],
      transactions: transactions || [],
      currency: currency || "INR",
      updatedAt: new Date().toISOString(),
    };

    // Save to memory
    memorySyncCache.set(deviceId, payload);

    // Save to filesystem
    try {
      await ensureDir();
      const filePath = path.join(SYNC_DIR, `${deviceId}.json`);
      await fs.writeFile(filePath, JSON.stringify(payload, null, 2), "utf-8");
    } catch (fsErr) {
      console.warn("Failed to write sync file, cached in-memory only:", fsErr);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process request" }, { status: 500 });
  }
}
