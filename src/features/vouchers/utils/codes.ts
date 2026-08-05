import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';

/** Generate a QR code data URL for a voucher code. */
export async function qrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, { margin: 1, width: 200 });
}

/** Generate a Code128 barcode data URL for a voucher code. */
export function barcodeDataUrl(text: string): string {
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, text, {
    format: 'CODE128',
    displayValue: false,
    margin: 0,
    height: 40,
    width: 2,
  });
  return canvas.toDataURL('image/png');
}

/** Format a numeric code with a space every 4 digits for readability. */
export function formatCode(code: string): string {
  return code.replace(/(.{4})/g, '$1 ').trim();
}
