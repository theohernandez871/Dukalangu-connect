/** Convert a company name into a URL-safe slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 48);
}

/** Normalize a Tanzanian phone number to +255 format. */
export function normalizeTzPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('255')) return `+${digits}`;
  if (digits.startsWith('0')) return `+255${digits.slice(1)}`;
  if (digits.length === 9) return `+255${digits}`;
  return raw.startsWith('+') ? raw : `+${digits}`;
}

/** Mask an email for display: j***@example.com */
export function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!name || !domain) return email;
  const visible = name.slice(0, 1);
  return `${visible}${'*'.repeat(Math.max(name.length - 1, 1))}@${domain}`;
}
