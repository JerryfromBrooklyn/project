import { 
  AttributeValue,
  ExecuteStatementCommandInput
} from '@aws-sdk/client-dynamodb';

/**
 * Marshall a JavaScript object to DynamoDB format
 * @param item Object to convert
 * @returns DynamoDB formatted object
 */
export const marshallItem = (item: any): Record<string, AttributeValue> => {
  const result: Record<string, AttributeValue> = {};

  for (const [key, value] of Object.entries(item)) {
    if (value === undefined) continue;

    if (value === null) {
      result[key] = { NULL: true };
    } else if (typeof value === 'string') {
      result[key] = { S: value };
    } else if (typeof value === 'number') {
      result[key] = { N: value.toString() };
    } else if (typeof value === 'boolean') {
      result[key] = { BOOL: value };
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        result[key] = { L: [] };
      } else if (typeof value[0] === 'string') {
        result[key] = { SS: value as string[] };
      } else if (typeof value[0] === 'number') {
        result[key] = { NS: value.map(n => n.toString()) };
      } else {
        result[key] = { L: value.map(v => marshallValue(v)) };
      }
    } else if (typeof value === 'object') {
      result[key] = { M: marshallItem(value) };
    }
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
  } else if (Array.isArray(value)) {
    return { L: value.map(v => marshallValue(v)) };
  } else if (typeof value === 'object') {
    return { M: marshallItem(value) };
  }
  // Default case, convert to string
  return { S: String(value) };
};

/**
 * Unmarshall a DynamoDB item to a JavaScript object
 * @param item DynamoDB formatted object
 * @returns Plain JavaScript object
 */
export const unmarshallItem = (item: Record<string, AttributeValue>): any => {
  const result: any = {};

  for (const [key, value] of Object.entries(item)) {
    result[key] = unmarshallValue(value);
  }

  return result;
};

/**
 * Unmarshall a DynamoDB value to a JavaScript value
 */
const unmarshallValue = (value: AttributeValue): any => {
  if (value.S !== undefined) {
    return value.S;
  } else if (value.N !== undefined) {
    return Number(value.N);
  } else if (value.BOOL !== undefined) {
    return value.BOOL;
  } else if (value.NULL !== undefined) {
    return null;
  } else if (value.M !== undefined) {
    return unmarshallItem(value.M);
  } else if (value.L !== undefined) {
    return value.L.map(v => unmarshallValue(v));
  } else if (value.SS !== undefined) {
    return value.SS;
  } else if (value.NS !== undefined) {
    return value.NS.map(n => Number(n));
  } else if (value.BS !== undefined) {
    return value.BS;
  }
  
  // Default case
  return null;
};

/**
 * Unmarshall an array of DynamoDB items to JavaScript objects
 * @param items Array of DynamoDB formatted objects
 * @returns Array of plain JavaScript objects
 */
export const unmarshallItems = (items: Record<string, AttributeValue>[]): any[] => {
  return items.map(item => unmarshallItem(item));
};

/**
 * Create params for a DynamoDB PartiQL query
 * @param statement PartiQL statement
 * @param parameters Query parameters
 * @returns Parameters for ExecuteStatementCommand
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
 * @param date Date to format
 * @returns ISO string date
 */
export const formatDate = (date: Date): string => {
  return date.toISOString();
};

/**
 * Parse a DynamoDB date string to a Date object
 * @param dateString ISO date string
 * @returns Date object
 */
export const parseDate = (dateString: string): Date => {
  return new Date(dateString);
}; 