/**
 * Phone Number Normalization & Formatting Utilities
 */

/**
 * Normalizes phone numbers to a standard 10-digit number.
 * Strips country code (+91, 91), leading zeros (0), spaces, hyphens, and parentheses.
 * @param {string} phone 
 * @returns {string} 10-digit normalized phone number, or cleaned digits
 */
export const normalizePhoneNumber = (phone) => {
  if (!phone) return '';
  // Strip all non-digit characters
  const cleaned = String(phone).replace(/\D/g, '');

  // If starts with 91 and has 12 digits, strip country code '91'
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return cleaned.slice(2);
  }

  // If starts with 0 and has 11 digits, strip leading '0'
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return cleaned.slice(1);
  }

  // If 10 digits or more, take the last 10 digits
  if (cleaned.length >= 10) {
    return cleaned.slice(-10);
  }

  return cleaned;
};

/**
 * Formats a 10-digit normalized phone number for clean UI presentation.
 * E.g., '9876543210' -> '+91 98765 43210'
 * @param {string} phone 
 * @returns {string} Formatted phone string
 */
export const formatDisplayPhone = (phone) => {
  const norm = normalizePhoneNumber(phone);
  if (!norm || norm.length !== 10) return phone || 'N/A';
  return `+91 ${norm.slice(0, 5)} ${norm.slice(5)}`;
};
