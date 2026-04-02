/**
 * Database Transaction Utilities
 * Ensures atomic operations for multi-step database operations
 */

import Database from 'better-sqlite3';
import logger from './logger';

export interface TransactionContext {
  db: Database.Database;
  transaction: Database.Transaction;
}

/**
 * Execute a function within a database transaction
 * Automatically commits on success, rolls back on error
 * 
 * @param db - Database instance
 * @param operation - Function to execute within transaction
 * @returns Result of the operation
 * @throws Error if transaction fails (after rollback)
 */
export async function withTransaction<T>(
  db: Database.Database,
  operation: (db: Database.Database) => T
): Promise<T> {
  // better-sqlite3 uses immediate transactions
  // Begin transaction
  db.prepare('BEGIN').run();
  
  try {
    const result = operation(db);
    
    // Commit if successful
    db.prepare('COMMIT').run();
    
    return result;
  } catch (error) {
    db.prepare('ROLLBACK').run();
    logger.error('Transaction failed, rolled back:', { error: (error as Error).message });
    throw error;
  }
}

/**
 * Synchronous version of transaction wrapper
 * For use when async/await is not needed
 */
export function withTransactionSync<T>(
  db: Database.Database,
  operation: (db: Database.Database) => T
): T {
  db.prepare('BEGIN').run();
  
  try {
    const result = operation(db);
    db.prepare('COMMIT').run();
    return result;
  } catch (error) {
    db.prepare('ROLLBACK').run();
    logger.error('Transaction failed, rolled back:', { error: (error as Error).message });
    throw error;
  }
}

/**
 * Create a transaction function that can be reused
 * @param db - Database instance
 * @returns Transaction function
 */
export function createTransaction(db: Database.Database) {
  return <T>(operation: (db: Database.Database) => T): T => {
    return withTransactionSync(db, operation);
  };
}

/**
 * Batch operation helper - executes multiple operations in a single transaction
 * @param db - Database instance
 * @param operations - Array of operations to execute
 * @returns Array of results
 */
export function batchOperations<T>(
  db: Database.Database,
  operations: ((db: Database.Database) => T)[]
): T[] {
  return withTransactionSync(db, (txDb) => {
    return operations.map(op => op(txDb));
  });
}

/**
 * Helper to check if we're currently in a transaction
 * Note: better-sqlite3 doesn't expose this directly, 
 * so we track it via a simple query
 */
export function isInTransaction(db: Database.Database): boolean {
  try {
    // Try to begin a transaction - if it fails, we're already in one
    db.prepare('BEGIN').run();
    db.prepare('ROLLBACK').run();
    return false;
  } catch {
    return true;
  }
}
