import { jsPDF } from 'jspdf';
import { qrDataUrl, formatCode } from './codes';
import type { Voucher } from '../types/voucher';

interface PdfOptions {
  companyName: string;
  packageName?: string | null;
  price?: number | null;
}

/**
 * Build a printable PDF of voucher tickets, 2 columns x 5 rows per A4 page,
 * each with a QR code and the numeric code. Returns a Blob URL.
 */
export async function buildVoucherPdf(vouchers: Voucher[], opts: PdfOptions): Promise<string> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = 210;
  const pageH = 297;
  const cols = 2;
  const rows = 5;
  const margin = 10;
  const gapX = 6;
  const gapY = 6;
  const cellW = (pageW - margin * 2 - gapX * (cols - 1)) / cols;
  const cellH = (pageH - margin * 2 - gapY * (rows - 1)) / rows;
  const perPage = cols * rows;

  for (let i = 0; i < vouchers.length; i++) {
    const posInPage = i % perPage;
    if (i > 0 && posInPage === 0) doc.addPage();

    const col = posInPage % cols;
    const row = Math.floor(posInPage / cols);
    const x = margin + col * (cellW + gapX);
    const y = margin + row * (cellH + gapY);

    // Ticket border
    doc.setDrawColor(200);
    doc.roundedRect(x, y, cellW, cellH, 2, 2);

    // Company name
    doc.setFontSize(9);
    doc.setTextColor(5, 150, 105); // emerald
    doc.text(opts.companyName, x + 4, y + 6);

    // Package + price
    doc.setTextColor(60);
    doc.setFontSize(8);
    if (opts.packageName) doc.text(opts.packageName, x + 4, y + 11);
    if (opts.price != null) {
      doc.text(`TSH ${opts.price.toLocaleString()}`, x + cellW - 4, y + 6, { align: 'right' });
    }

    // QR code
    const qr = await qrDataUrl(vouchers[i].code);
    const qrSize = Math.min(cellH - 18, 24);
    doc.addImage(qr, 'PNG', x + 4, y + 14, qrSize, qrSize);

    // Code text
    doc.setTextColor(20);
    doc.setFontSize(13);
    doc.setFont('courier', 'bold');
    doc.text(formatCode(vouchers[i].code), x + qrSize + 8, y + 14 + qrSize / 2, {
      baseline: 'middle',
    });
    doc.setFont('helvetica', 'normal');
  }

  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
}
