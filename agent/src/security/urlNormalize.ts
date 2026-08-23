// Smart normaliser for the Supabase System URL. Customers often paste the URL
// with small mistakes that cause 404s (a trailing slash, a copied "/functions/v1"
// suffix, http instead of https, or surrounding spaces). This cleans all of
// those so the agent talks to the right endpoint regardless.

export interface NormalisedUrl {
  url: string;        // cleaned base URL, e.g. https://abc.supabase.co
  warning?: string;   // human note if something looked off (for the wizard UI)
}

/** Clean a pasted System URL into a proper Supabase base URL. */
export function normalizeSupabaseUrl(raw: string): NormalisedUrl {
  let url = (raw ?? '').trim();
  let warning: string | undefined;

  if (!url) return { url: '' };

  // Strip surrounding quotes some people copy in.
  url = url.replace(/^["']|["']$/g, '').trim();

  // Add https:// if the scheme is missing entirely.
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
    warning = 'Nimeongeza https:// mwanzoni mwa System URL.';
  }

  // Upgrade http:// to https:// (Supabase is always https).
  if (/^http:\/\//i.test(url)) {
    url = url.replace(/^http:\/\//i, 'https://');
    warning = 'Nimebadilisha http kuwa https.';
  }

  // Remove an accidentally pasted path such as /functions/v1 or /functions/v1/agent-gateway.
  url = url.replace(/\/functions\/v1.*$/i, '');

  // Remove any other trailing path/slashes so only the origin remains.
  try {
    const u = new URL(url);
    url = `${u.protocol}//${u.host}`;
  } catch {
    // If URL parsing fails, fall back to a simple trailing-slash strip.
    url = url.replace(/\/+$/, '');
  }

  return { url, warning };
}

/** Build a full Edge Function URL from a (possibly messy) base URL. */
export function functionUrl(rawBase: string, fn: string): string {
  const { url } = normalizeSupabaseUrl(rawBase);
  return `${url}/functions/v1/${fn}`;
}
