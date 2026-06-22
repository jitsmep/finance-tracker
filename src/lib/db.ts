import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { Pool, neonConfig } from "@neondatabase/serverless";

dotenv.config();

// Force local development firewalls to bypass using WebSockets
if (typeof window === "undefined" && process.env.NODE_ENV === "development") {
  const ws = require("ws");
  neonConfig.webSocketConstructor = ws;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  const rawUrl = process.env.DATABASE_URL;
  const connectionString = typeof rawUrl === "string" ? rawUrl.trim() : "";

  if (!connectionString || !connectionString.startsWith("postgres")) {
    console.warn("DATABASE_URL missing or malformed – using a mock Prisma client for dev");
    // Return a mock client with empty methods to avoid crashes in dev
    return new Proxy(new PrismaClient(), {
      get(target, prop) {
        if (typeof target[prop as keyof PrismaClient] === "function") {
          return async () => [];
        }
        return target[prop as keyof PrismaClient];
      },
    }) as PrismaClient;
  }

  try {
    return new PrismaClient({
      datasources: {
        db: { url: connectionString },
      },
    });
  } catch (e) {
    console.error("Failed to initialize PrismaClient:", e);
    throw e;
  }
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;