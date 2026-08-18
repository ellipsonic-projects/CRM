/**
 * Normalizes a phone number and generates a WhatsApp (wa.me) URL.
 * Returns null if the phone number is missing, empty, or invalid.
 */
export function getWhatsAppUrl(phone?: string | null): string | null {
  if (!phone || typeof phone !== 'string') {
    return null;
  }

  const trimmed = phone.trim();
  if (!trimmed) {
    return null;
  }

  // Remove all non-digit characters
  let digits = trimmed.replace(/\D/g, '');

  // Strip leading zero if 11 digits (e.g., 09876543210 -> 9876543210)
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // If 10 digits, assume standard Indian mobile number and prepend 91
  if (digits.length === 10) {
    digits = `91${digits}`;
  }

  if (digits.length < 7) {
    return null;
  }

  return `https://wa.me/${digits}`;
}
