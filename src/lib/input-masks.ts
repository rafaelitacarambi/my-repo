/**
 * Input mask utilities for currency (BRL) and CPF formatting
 */

/**
 * Format a number to BRL currency format (R$ 0.000,00)
 * @param value - The numeric value or string to format
 * @returns Formatted currency string
 */
export function formatCurrency(value: number | string | undefined): string {
  if (value === undefined || value === null || value === '') return '';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numValue);
}

/**
 * Parse a BRL currency string to a number
 * @param value - The formatted currency string (e.g., "R$ 1.000,00")
 * @returns The numeric value
 */
export function parseCurrency(value: string): number {
  if (!value) return 0;
  
  // Remove "R$", spaces, dots (thousand separator) and replace comma with dot
  const cleaned = value
    .replace(/R\$/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(/,/g, '.');
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Handle currency input change with automatic formatting
 * @param value - The input value from the event
 * @returns Object with displayValue (formatted) and numericValue (number)
 */
export function handleCurrencyInput(value: string): { displayValue: string; numericValue: number } {
  // Remove all non-numeric characters except comma and dot
  let cleaned = value.replace(/[^\d,]/g, '');
  
  // If empty, return zeros
  if (!cleaned) {
    return { displayValue: '', numericValue: 0 };
  }
  
  // Remove any existing commas (user might paste formatted value)
  cleaned = cleaned.replace(/,/g, '');
  
  // Convert to number (treating as cents)
  const numericValue = parseInt(cleaned) / 100;
  
  // Format as currency
  const displayValue = formatCurrency(numericValue);
  
  return { displayValue, numericValue };
}

/**
 * Format a CPF string with mask (000.000.000-00)
 * @param value - The CPF string (with or without formatting)
 * @returns Formatted CPF string
 */
export function formatCPF(value: string | undefined): string {
  if (!value) return '';
  
  // Remove all non-numeric characters
  const cleaned = value.replace(/\D/g, '');
  
  // Limit to 11 digits
  const limited = cleaned.substring(0, 11);
  
  // Apply mask
  if (limited.length <= 3) {
    return limited;
  } else if (limited.length <= 6) {
    return `${limited.slice(0, 3)}.${limited.slice(3)}`;
  } else if (limited.length <= 9) {
    return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6)}`;
  } else {
    return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6, 9)}-${limited.slice(9)}`;
  }
}

/**
 * Parse a formatted CPF string to only numbers
 * @param value - The formatted CPF string (e.g., "123.456.789-00")
 * @returns The numeric CPF string (e.g., "12345678900")
 */
export function parseCPF(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Validate CPF format and checksum
 * @param cpf - The CPF string (with or without formatting)
 * @returns true if valid, false otherwise
 */
export function validateCPF(cpf: string): boolean {
  const cleaned = parseCPF(cpf);
  
  // Must have exactly 11 digits
  if (cleaned.length !== 11) return false;
  
  // Check for known invalid CPFs (all same digit)
  if (/^(\d)\1{10}$/.test(cleaned)) return false;
  
  // Validate checksum digits
  let sum = 0;
  let remainder;
  
  // First check digit
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.substring(9, 10))) return false;
  
  // Second check digit
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.substring(10, 11))) return false;
  
  return true;
}

/**
 * Handle CPF input change with automatic formatting
 * @param value - The input value from the event
 * @returns Object with displayValue (formatted) and isValid (boolean)
 */
export function handleCPFInput(value: string): { displayValue: string; isValid: boolean } {
  const formatted = formatCPF(value);
  const isValid = formatted.length === 14 ? validateCPF(formatted) : true; // Only validate when complete
  
  return { displayValue: formatted, isValid };
}
