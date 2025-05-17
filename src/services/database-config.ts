import pkg from 'pg';
const { types } = pkg;

/**
 * Configure global PostgreSQL type parsers
 * This affects all database connections in the application
 */
export function configureTypeParser() {
  // Configure type parser for bigint (OID: 20)
  types.setTypeParser(20, function(val) {
    if (val === null) return null;
    const parsed = parseInt(val, 10);
    // Only convert to number if within safe integer range
    if (parsed <= Number.MAX_SAFE_INTEGER && parsed >= Number.MIN_SAFE_INTEGER) {
      return parsed;
    }
    // For values outside safe range, return as string
    return val;
  });
} 