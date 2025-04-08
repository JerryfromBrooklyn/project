import { 
  AttributeValue,
  ExecuteStatementCommandInput
} from '@aws-sdk/client-dynamodb';

// --- Custom Marshalling/Unmarshalling (Needed if not using DocumentClient everywhere) --- //

/**
 * Marshall a JavaScript object to DynamoDB format
 */
export const marshallItem = (item: any): Record<string, AttributeValue> => {
  const result: Record<string, AttributeValue> = {};
  for (const [key, value] of Object.entries(item)) {
    if (value === undefined) continue;
    result[key] = marshallValue(value);
  }
  return result;
};

/**
 * Marshall a single value to DynamoDB format
 */
const marshallValue = (value: any): AttributeValue => {
  if (value === null) {
    return { NULL: true };
  } else if (typeof value === 'string') {
    return { S: value };
  } else if (typeof value === 'number') {
    return { N: value.toString() };
  } else if (typeof value === 'boolean') {
    return { BOOL: value };
  } else if (value instanceof Uint8Array) { // Handle binary data
    return { B: value };
  } else if (Array.isArray(value)) {
    // Check for Set types (String Set, Number Set, Binary Set)
    if (value.length > 0) {
      if (value.every(el => typeof el === 'string')) {
        return { SS: value };
      }
      if (value.every(el => typeof el === 'number')) {
        return { NS: value.map(n => n.toString()) };
      }
      if (value.every(el => el instanceof Uint8Array)) {
        return { BS: value };
      }
    }
    // Otherwise, it's a generic List
    return { L: value.map(v => marshallValue(v)) };
  } else if (typeof value === 'object') {
    return { M: marshallItem(value) };
  }
  // Fallback: attempt to stringify unknown types?
  console.warn("Marshalling unknown type to string:", value);
  return { S: String(value) };
};

/**
 * Unmarshall a DynamoDB item to a JavaScript object
 */
export const unmarshallItem = (item: Record<string, AttributeValue> | undefined): any => {
  if (!item) return {}; // Handle undefined item gracefully
  const result: any = {};
  for (const [key, value] of Object.entries(item)) {
    result[key] = unmarshallValue(value);
  }
  return result;
};

/**
 * Unmarshall a DynamoDB value to a JavaScript value (Corrected for SDK v3)
 */
const unmarshallValue = (value: AttributeValue): any => {
  // Explicitly assert the type to help TypeScript
  const val = value as any; 

  // Order matters slightly: check specific types before general ones
  if (val.S !== undefined) return val.S;
  if (val.N !== undefined) return Number(val.N);
  if (val.BOOL !== undefined) return val.BOOL;
  if (val.NULL !== undefined && val.NULL === true) return null; // Check NULL before M/L
  if (val.M !== undefined) return unmarshallItem(val.M); // Check Map
  if (val.L !== undefined) return val.L.map((v: AttributeValue) => unmarshallValue(v)); // Check List, add type to map param
  if (val.SS !== undefined) return val.SS; // Check String Set
  if (val.NS !== undefined) return val.NS.map((n: string) => Number(n)); // Check Number Set, add type to map param
  if (val.BS !== undefined) return val.BS; // Check Binary Set
  if (val.B !== undefined) return val.B;   // Check Binary
  
  // If none of the above match, it's an unknown or unexpected format
  console.warn("UnmarshallValue encountered unexpected AttributeValue format:", JSON.stringify(val));
  return undefined; // Return undefined or throw error for unknown types
};

/**
 * Unmarshall an array of DynamoDB items
 */
export const unmarshallItems = (items: Record<string, AttributeValue>[]): any[] => {
  return items.map(item => unmarshallItem(item));
};

// --- Other Utility Functions --- //

/**
 * Create params for a DynamoDB PartiQL query
 */
export const createPartiQLParams = (
  statement: string,
  parameters: any[] = []
): ExecuteStatementCommandInput => {
  return {
    Statement: statement,
    Parameters: parameters.map(param => marshallValue(param))
  };
};

/**
 * Format a date for DynamoDB (ISO string)
 */
export const formatDate = (date: Date): string => {
  return date.toISOString();
};

/**
 * Parse a DynamoDB date string
 */
export const parseDate = (dateString: string): Date => {
  return new Date(dateString);
}; 