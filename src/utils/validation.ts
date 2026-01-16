/**
 * Validation Utilities
 * Common validation helpers (DRY)
 */

export class Validators {
  static isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  static isValidUUID(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  }

  static requireFields<T extends Record<string, any>>(
    obj: T,
    fields: (keyof T)[]
  ): { valid: boolean; missing: string[] } {
    const missing = fields.filter(field => !obj[field]);
    return {
      valid: missing.length === 0,
      missing: missing as string[],
    };
  }

  static sanitizeString(str: string): string {
    return str.trim().replace(/[<>]/g, '');
  }

  static isPositiveNumber(value: any): boolean {
    return typeof value === 'number' && value > 0 && !isNaN(value);
  }
}
