import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

dotenv.config();

// Force server-side environment to use WebSockets for database connection (bypassing port 5432 block)
if (typeof window === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  const rawUrl = process.env.DATABASE_URL;
  const connectionString = typeof rawUrl === "string" ? rawUrl.replace(/^["']|["']$/g, "").trim() : "";

  const createMockClient = () => {
    return new Proxy(new PrismaClient(), {
      get(target, prop) {
        if (typeof target[prop as keyof PrismaClient] === "function") {
          return async () => [];
        }
        return target[prop as keyof PrismaClient];
      },
    }) as PrismaClient;
  };

  if (!connectionString || !connectionString.startsWith("postgres")) {
    console.warn("DATABASE_URL missing or malformed – using a mock Prisma client for dev");
    return createMockClient();
  }

  try {
    const adapter = new PrismaNeon({ connectionString });
    return new PrismaClient({ adapter });
  } catch (e) {
    console.error("Failed to initialize PrismaClient with Neon adapter, falling back to mock:", e);
    return createMockClient();
  }
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;