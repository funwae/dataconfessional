import { PrismaClient } from '@prisma/client'
import { initializeDatabasePath } from './database-path'

// Initialize database path before creating Prisma client
// This is called synchronously, but the actual path resolution happens async
// For desktop mode, we'll set a default and update it when Tauri is available
if (typeof window === 'undefined') {
  // Server-side: Initialize database path
  // Note: This is a best-effort initialization. For API routes, we'll ensure
  // the path is set before using Prisma
  initializeDatabasePath().catch(console.error);
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma client with current DATABASE_URL
// If DATABASE_URL is not set yet, it will use the default from schema
export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Helper function to ensure database is initialized before use
export async function ensureDatabaseInitialized(): Promise<void> {
  try {
    await initializeDatabasePath();
    // Recreate Prisma client if DATABASE_URL changed
    if (globalForPrisma.prisma) {
      await globalForPrisma.prisma.$disconnect();
      globalForPrisma.prisma = undefined;
    }
  } catch (error: any) {
    console.error('Database initialization error:', error);
    throw new Error(`Failed to initialize database: ${error.message || 'Unknown error'}`);
  }
}

// Helper to handle database connection errors gracefully
export async function withDatabaseErrorHandling<T>(
  operation: () => Promise<T>,
  errorMessage: string = 'Database operation failed'
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    if (error.code === 'P1001') {
      throw new Error('Cannot connect to database. Please ensure the database file is accessible.');
    } else if (error.code === 'P1010') {
      throw new Error('Database access denied. Please check file permissions.');
    } else if (error.code === 'P2002') {
      throw new Error('A record with this value already exists.');
    } else {
      console.error('Database error:', error);
      throw new Error(`${errorMessage}: ${error.message || 'Unknown error'}`);
    }
  }
}


