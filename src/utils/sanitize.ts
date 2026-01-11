import DOMPurify from 'dompurify';

/**
 * Sanitize text input to prevent XSS attacks
 * Removes all HTML tags and dangerous characters
 */
export const sanitizeText = (input: string): string => {
    if (!input) return '';

    // Remove all HTML tags and attributes
    const sanitized = DOMPurify.sanitize(input, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: []
    });

    return sanitized.trim();
};

/**
 * Sanitize and validate a number within a range
 */
export const sanitizeNumber = (
    input: number,
    min: number = 0,
    max: number = 1000000000
): number => {
    if (isNaN(input) || !isFinite(input)) return 0;
    return Math.max(min, Math.min(max, input));
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
};

/**
 * Validate member name
 * Must be 1-50 characters after sanitization
 */
export const validateMemberName = (name: string): { valid: boolean; sanitized: string; error?: string } => {
    const sanitized = sanitizeText(name);

    if (sanitized.length === 0) {
        return { valid: false, sanitized, error: 'El nombre no puede estar vacío' };
    }

    if (sanitized.length > 50) {
        return { valid: false, sanitized, error: 'El nombre no puede tener más de 50 caracteres' };
    }

    return { valid: true, sanitized };
};

/**
 * Validate expense description
 * Must be 1-200 characters after sanitization
 */
export const validateExpenseDescription = (description: string): { valid: boolean; sanitized: string; error?: string } => {
    const sanitized = sanitizeText(description);

    if (sanitized.length === 0) {
        return { valid: false, sanitized, error: 'La descripción no puede estar vacía' };
    }

    if (sanitized.length > 200) {
        return { valid: false, sanitized, error: 'La descripción no puede tener más de 200 caracteres' };
    }

    return { valid: true, sanitized };
};

/**
 * Validate expense amount
 * Must be positive and within reasonable limits
 */
export const validateExpenseAmount = (amount: number): { valid: boolean; sanitized: number; error?: string } => {
    const sanitized = sanitizeNumber(amount, 0, 1000000000);

    if (sanitized <= 0) {
        return { valid: false, sanitized: 0, error: 'El monto debe ser mayor a 0' };
    }

    if (sanitized > 1000000000) {
        return { valid: false, sanitized: 0, error: 'El monto es demasiado grande' };
    }

    return { valid: true, sanitized };
};

/**
 * Validate array size to prevent DoS attacks
 */
export const validateArraySize = <T>(
    array: T[],
    maxSize: number,
    itemName: string
): { valid: boolean; error?: string } => {
    if (!Array.isArray(array)) {
        return { valid: false, error: `${itemName} debe ser un array` };
    }

    if (array.length > maxSize) {
        return { valid: false, error: `Demasiados ${itemName} (máximo: ${maxSize})` };
    }

    return { valid: true };
};
