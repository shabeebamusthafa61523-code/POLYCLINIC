/**
 * Frontend Phone Normalization & Formatting Utilities
 */

export const normalizePhoneNumber = (phone) => {
  if (!phone) return '';
  const cleaned = String(phone).replace(/\D/g, '');

  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return cleaned.slice(2);
  }

  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return cleaned.slice(1);
  }

  if (cleaned.length >= 10) {
    return cleaned.slice(-10);
  }

  return cleaned;
};

export const formatDisplayPhone = (phone) => {
  const norm = normalizePhoneNumber(phone);
  if (!norm || norm.length !== 10) return phone || 'N/A';
  return `+91 ${norm.slice(0, 5)} ${norm.slice(5)}`;
};
