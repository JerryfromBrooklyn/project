/**
 * Database Validation Utility
 *
 * Provides validation utilities for ensuring database constraints are met
 * before attempting database operations.
 */
/**
 * Schema definitions for database tables
 * Maps table names to required fields and their default values
 */
const tableSchemas = {
    photos: {
        required: ['id', 'storage_path', 'public_url', 'uploaded_by', 'file_size', 'file_type'],
        defaults: {
            faces: [],
            matched_users: [],
            face_ids: [],
            tags: [],
            location: { lat: null, lng: null, name: null },
            venue: { id: null, name: null },
            event_details: { name: null, date: null, type: null },
            file_type: 'image/jpeg'
        }
    },
    face_data: {
        required: ['user_id', 'face_id'],
        defaults: {
            face_data: {}
        }
    },
    unassociated_faces: {
        required: ['face_id', 'photo_id', 'external_image_id'],
        defaults: {
            attributes: {}
        }
    }
};
/**
 * Validates data against the schema for a specific table
 *
 * @param {string} tableName - The database table name
 * @param {Object} data - The data to validate
 * @returns {Object} - Validated data with defaults applied
 * @throws {Error} - If validation fails
 */
export const validateForTable = (tableName, data) => {
    const schema = tableSchemas[tableName];
    if (!schema) {
        throw new Error(`No schema defined for table: ${tableName}`);
    }
    // Check required fields
    const missingFields = schema.required.filter(field => {
        // Consider empty strings as null/undefined for validation purposes
        return data[field] === undefined || data[field] === null || data[field] === '';
    });
    if (missingFields.length > 0) {
        throw new Error(`Missing required fields for ${tableName}: ${missingFields.join(', ')}`);
    }
    // Create a new object with all original data preserved
    const validatedData = { ...data };
    // Apply defaults for missing (but not required) fields
    Object.entries(schema.defaults).forEach(([field, defaultValue]) => {
        if (validatedData[field] === undefined || validatedData[field] === null) {
            validatedData[field] = defaultValue;
        }
    });
    // Ensure that all required fields are still present
    schema.required.forEach(field => {
        if (validatedData[field] === undefined || validatedData[field] === null) {
            throw new Error(`Required field ${field} is missing after validation`);
        }
    });
    return validatedData;
};
/**
 * Generic validation utility for database records
 *
 * @param {Object} data - The data to validate
 * @param {Array<string>} requiredFields - List of required field names
 * @param {Object} defaults - Default values for fields
 * @returns {Object} - Validated data with defaults applied
 * @throws {Error} - If validation fails
 */
export const validateRecord = (data, requiredFields = [], defaults = {}) => {
    // Check required fields
    const missingFields = requiredFields.filter(field => {
        return data[field] === undefined || data[field] === null;
    });
    if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    // Apply defaults for missing (but not required) fields
    const validatedData = { ...data };
    Object.entries(defaults).forEach(([field, defaultValue]) => {
        if (validatedData[field] === undefined) {
            validatedData[field] = defaultValue;
        }
    });
    return validatedData;
};
/**
 * Ensures data arrays are initialized
 *
 * @param {Object} data - The data object to validate
 * @param {Array<string>} arrayFields - List of field names that should be arrays
 * @returns {Object} - Data with arrays initialized
 */
export const ensureArrayFields = (data, arrayFields) => {
    const result = { ...data };
    arrayFields.forEach(field => {
        if (!Array.isArray(result[field])) {
            result[field] = [];
        }
    });
    return result;
};
/**
 * Ensures JSON object fields are properly initialized
 *
 * @param {Object} data - The data object to validate
 * @param {Object} jsonFields - Map of field names to their default structures
 * @returns {Object} - Data with JSON fields initialized
 */
export const ensureJsonFields = (data, jsonFields) => {
    const result = { ...data };
    Object.entries(jsonFields).forEach(([field, defaultValue]) => {
        if (!result[field] || typeof result[field] !== 'object') {
            result[field] = defaultValue;
        }
    });
    return result;
};
export default {
    validateForTable,
    validateRecord,
    ensureArrayFields,
    ensureJsonFields
};
