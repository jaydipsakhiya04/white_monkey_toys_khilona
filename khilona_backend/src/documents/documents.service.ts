import { Inject, Injectable, Logger } from '@nestjs/common';
import { Store } from '@prisma/client';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import PDFDocument from 'pdfkit';
import { toNumber } from '../common/utils/money';
import { slugify } from '../common/utils/slug';
import { APP_CONFIG, AppConfig } from '../config/configuration';
import { OrderDetailRow } from '../orders/order.mapper';
import { ORDER_STATUS_LABELS } from '../orders/order-status';

export type DocumentKind = 'invoice' | 'receipt';

export interface GeneratedDocument {
  filename: string;
  buffer: Buffer;
}

type Doc = InstanceType<typeof PDFDocument>;

const INK = '#0A0A0A';
const MUTED = '#6B6B6B';
const LINE = '#E5E5E5';
const SOFT = '#F5F5F4';

const PAYMENT_METHOD_LABELS: Record<string, string> = { CASH_ON_DELIVERY: 'Pay on delivery (cash / UPI)' };
const PAYMENT_STATUS_LABELS: Record<string, string> = { UNPAID: 'Due on delivery', PAID: 'Paid', REFUNDED: 'Refunded' };

const FONT_FILES = { regular: 'Inter-Regular.ttf', semibold: 'Inter-SemiBold.ttf', bold: 'Inter-Bold.ttf' } as const;

/**
 * Generates customer documents (invoice / order receipt) as PDFs.
 *
 * Everything printed comes from the order's own snapshot columns (item names, SKUs, options,
 * unit prices, totals, delivery address) — never from the live catalogue — so a document for an
 * old order stays correct after products are renamed, repriced, archived or deleted.
 */
@Injectable()
export class DocumentsService {
  private readonly logger = new Logger('Documents');
  private readonly fonts: { regular: string; semibold: string; bold: string } | null;
  private readonly money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 });

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {
    this.fonts = this.locateFonts();
    if (!this.fonts) this.logger.warn('Inter fonts not found in assets/fonts; PDFs fall back to Helvetica (₹ shown as "Rs.")');
  }

  /** Invoice number derived from the (unique) order number: WMT-20261002-0012 → INV-20261002-0012. */
  invoiceNumber(orderNumber: string) {
    return orderNumber.replace(/^[A-Z]+-/, 'INV-');
  }

  filename(kind: DocumentKind, store: Pick<Store, 'name'>, orderNumber: string) {
    return `${slugify(store.name) || 'store'}-${kind}-${orderNumber}.pdf`;
  }

  async generate(kind: DocumentKind, order: OrderDetailRow, store: Store): Promise<GeneratedDocument> {
    const buffer = kind === 'invoice' ? await this.invoice(order, store) : await this.receipt(order, store);
    return { filename: this.filename(kind, store, order.orderNumber), buffer };
  }

  // ─── Invoice ───────────────────────────────────────────────

  private invoice(order: OrderDetailRow, store: Store): Promise<Buffer> {
    return this.render(`${store.name} invoice ${order.orderNumber}`, store, (doc) => {
      const left = doc.page.margins.left;
      const width = doc.page.width - left - doc.page.margins.right;
      const top = doc.page.margins.top;

      // Header: brand + store details (left), document title + meta (right)
      this.wordmark(doc, store, left, top);
      const storeLines = this.storeLines(store);
      this.font(doc, 'regular').fontSize(8.5).fillColor(MUTED);
      let y = top + 26;
      for (const line of storeLines) {
        doc.text(line, left, y, { width: width * 0.5 });
        y = doc.y + 1;
      }
      const leftBottom = y;

      const metaX = left + width * 0.56;
      const metaW = width * 0.44;
      this.font(doc, 'bold').fontSize(20).fillColor(INK).text('Invoice / Bill', metaX, top - 2, { width: metaW, align: 'right' });
      const invoiceDate = order.deliveredAt ?? order.confirmedAt ?? order.createdAt;
      const meta: [string, string][] = [
        ['Invoice number', this.invoiceNumber(order.orderNumber)],
        ['Order number', order.orderNumber],
        ['Invoice date', this.date(invoiceDate)],
        ['Order date', this.date(order.createdAt)],
        ['Order status', ORDER_STATUS_LABELS[order.status]],
        ['Payment method', PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod],
        ['Payment status', PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus],
      ];
      y = top + 30;
      for (const [label, value] of meta) {
        this.font(doc, 'regular').fontSize(8.5).fillColor(MUTED).text(label, metaX, y, { width: metaW * 0.45 });
        this.font(doc, 'semibold').fontSize(8.5).fillColor(INK).text(value, metaX + metaW * 0.45, y, { width: metaW * 0.55, align: 'right' });
        y += 13;
      }

      y = Math.max(leftBottom, y) + 14;
      this.rule(doc, left, y, width);
      y += 16;

      // Bill to / Deliver to
      y = this.addressBlock(doc, order, left, y, width);
      y += 18;

      // Items
      const cols = [
        { key: 'item', label: 'Product', width: width * 0.44, align: 'left' as const },
        { key: 'sku', label: 'SKU', width: width * 0.18, align: 'left' as const },
        { key: 'qty', label: 'Qty', width: width * 0.08, align: 'right' as const },
        { key: 'price', label: 'Price', width: width * 0.15, align: 'right' as const },
        { key: 'total', label: 'Total', width: width * 0.15, align: 'right' as const },
      ];
      const header = (atY: number) => {
        doc.rect(left, atY, width, 22).fill(SOFT);
        let x = left;
        this.font(doc, 'semibold').fontSize(8).fillColor(MUTED);
        for (const c of cols) {
          doc.text(c.label.toUpperCase(), x + 8, atY + 7, { width: c.width - 16, align: c.align, characterSpacing: 0.4 });
          x += c.width;
        }
        return atY + 22;
      };
      y = header(y);

      for (const item of order.items) {
        const options = this.itemOptions(item);
        const nameH = this.font(doc, 'semibold').fontSize(9).heightOfString(item.productName, { width: cols[0].width - 16 });
        const optH = options ? this.font(doc, 'regular').fontSize(8).heightOfString(options, { width: cols[0].width - 16 }) + 2 : 0;
        const rowH = Math.max(nameH + optH, 12) + 16;
        if (y + rowH > this.contentBottom(doc) - 10) {
          doc.addPage();
          y = header(doc.page.margins.top);
        }
        let x = left;
        this.font(doc, 'semibold').fontSize(9).fillColor(INK).text(item.productName, x + 8, y + 8, { width: cols[0].width - 16 });
        if (options) this.font(doc, 'regular').fontSize(8).fillColor(MUTED).text(options, x + 8, y + 8 + nameH + 2, { width: cols[0].width - 16 });
        x += cols[0].width;
        const cells = [item.sku ?? '—', String(item.quantity), this.amount(item.unitPrice), this.amount(item.lineTotal)];
        cells.forEach((value, i) => {
          const c = cols[i + 1];
          this.font(doc, i === 3 ? 'semibold' : 'regular').fontSize(9).fillColor(i === 0 ? MUTED : INK)
            .text(value, x + 8, y + 8, { width: c.width - 16, align: c.align });
          x += c.width;
        });
        y += rowH;
        this.rule(doc, left, y, width);
      }

      // Totals
      y += 12;
      if (y + 110 > this.contentBottom(doc)) {
        doc.addPage();
        y = doc.page.margins.top;
      }
      y = this.totals(doc, order, left + width * 0.5, y, width * 0.5);

      y += 22;
      this.font(doc, 'regular').fontSize(8.5).fillColor(MUTED);
      doc.text(
        `Amounts in Indian Rupees. ${order.paymentStatus === 'PAID' ? 'Payment received with thanks.' : 'Payment is collected on delivery (cash / UPI).'}`,
        left, y, { width },
      );
      doc.text('This is a computer-generated invoice and does not require a signature.', left, doc.y + 2, { width });
    });
  }

  // ─── Receipt ───────────────────────────────────────────────

  private receipt(order: OrderDetailRow, store: Store): Promise<Buffer> {
    return this.render(`${store.name} order receipt ${order.orderNumber}`, store, (doc) => {
      const left = doc.page.margins.left;
      const width = doc.page.width - left - doc.page.margins.right;
      let y = doc.page.margins.top;

      this.wordmark(doc, store, left, y, width, 'center');
      y += 30;
      this.font(doc, 'semibold').fontSize(9).fillColor(MUTED).text('ORDER RECEIPT', left, y, { width, align: 'center', characterSpacing: 2 });
      y += 26;

      // Summary band
      doc.roundedRect(left, y, width, 64, 10).fill(SOFT);
      const colW = width / 3;
      const cells: [string, string][] = [
        ['Order number', order.orderNumber],
        ['Order date', this.date(order.createdAt)],
        ['Status', ORDER_STATUS_LABELS[order.status]],
      ];
      cells.forEach(([label, value], i) => {
        this.font(doc, 'regular').fontSize(8).fillColor(MUTED).text(label, left + colW * i + 14, y + 15, { width: colW - 28 });
        this.font(doc, 'bold').fontSize(11).fillColor(INK).text(value, left + colW * i + 14, y + 30, { width: colW - 28 });
      });
      y += 84;

      y = this.addressBlock(doc, order, left, y, width);
      y += 20;

      this.font(doc, 'bold').fontSize(11).fillColor(INK).text(`Items (${order.itemsCount})`, left, y);
      y = doc.y + 8;
      this.rule(doc, left, y, width);
      for (const item of order.items) {
        const options = this.itemOptions(item);
        const nameW = width * 0.68;
        const nameH = this.font(doc, 'semibold').fontSize(9.5).heightOfString(item.productName, { width: nameW });
        const rowH = nameH + (options ? 13 : 0) + 30;
        if (y + rowH > this.contentBottom(doc) - 10) {
          doc.addPage();
          y = doc.page.margins.top;
        }
        this.font(doc, 'semibold').fontSize(9.5).fillColor(INK).text(item.productName, left, y + 10, { width: nameW });
        let lineY = y + 10 + nameH + 2;
        if (options) {
          this.font(doc, 'regular').fontSize(8).fillColor(MUTED).text(options, left, lineY, { width: nameW });
          lineY += 13;
        }
        this.font(doc, 'regular').fontSize(8.5).fillColor(MUTED).text(`Qty ${item.quantity} × ${this.amount(item.unitPrice)}`, left, lineY, { width: nameW });
        this.font(doc, 'semibold').fontSize(9.5).fillColor(INK).text(this.amount(item.lineTotal), left + nameW, y + 10, { width: width - nameW, align: 'right' });
        y += rowH;
        this.rule(doc, left, y, width);
      }

      y += 12;
      if (y + 130 > this.contentBottom(doc)) {
        doc.addPage();
        y = doc.page.margins.top;
      }
      y = this.totals(doc, order, left + width * 0.45, y, width * 0.55);
      y += 10;
      this.font(doc, 'regular').fontSize(9).fillColor(MUTED).text('Payment method', left + width * 0.45, y, { width: width * 0.25 });
      this.font(doc, 'semibold').fontSize(9).fillColor(INK)
        .text(PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod, left + width * 0.7, y, { width: width * 0.3, align: 'right' });

      y = doc.y + 36;
      this.rule(doc, left + width * 0.3, y, width * 0.4);
      this.font(doc, 'regular').fontSize(10).fillColor(MUTED).text('Thank you for shopping with', left, y + 16, { width, align: 'center' });
      this.font(doc, 'bold').fontSize(13).fillColor(INK).text(store.name.toUpperCase(), left, doc.y + 4, { width, align: 'center', characterSpacing: 1.5 });
    });
  }

  // ─── Building blocks ───────────────────────────────────────

  private render(title: string, store: Store, draw: (doc: Doc) => void): Promise<Buffer> {
    return new Promise((resolvePromise, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 48, bottom: 56, left: 48, right: 48 },
        bufferPages: true,
        info: { Title: title, Author: store.name, Creator: store.name, Producer: store.name },
      });
      if (this.fonts) {
        doc.registerFont('wmt-regular', this.fonts.regular);
        doc.registerFont('wmt-semibold', this.fonts.semibold);
        doc.registerFont('wmt-bold', this.fonts.bold);
      }
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolvePromise(Buffer.concat(chunks)));
      doc.on('error', reject);
      try {
        draw(doc);
        this.footers(doc, store);
        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  private footers(doc: Doc, store: Store) {
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      const bottom = doc.page.margins.bottom;
      doc.page.margins.bottom = 0; // writing inside the margin must not trigger a new page
      const y = doc.page.height - 36;
      const left = doc.page.margins.left;
      const width = doc.page.width - left - doc.page.margins.right;
      this.font(doc, 'regular').fontSize(7.5).fillColor(MUTED);
      doc.text([store.name, store.phone, store.email].filter(Boolean).join('  ·  '), left, y, { width: width * 0.8, lineBreak: false });
      doc.text(`Page ${i - range.start + 1} of ${range.count}`, left + width * 0.8, y, { width: width * 0.2, align: 'right', lineBreak: false });
      doc.page.margins.bottom = bottom;
    }
  }

  private wordmark(doc: Doc, store: Store, x: number, y: number, width?: number, align: 'left' | 'center' = 'left') {
    this.font(doc, 'bold').fontSize(16).fillColor(INK)
      .text(store.name.toUpperCase(), x, y, { characterSpacing: 1.6, ...(width ? { width, align } : {}) });
  }

  private addressBlock(doc: Doc, order: OrderDetailRow, left: number, y: number, width: number) {
    const colW = (width - 24) / 2;
    const block = (title: string, lines: string[], x: number) => {
      this.font(doc, 'semibold').fontSize(8).fillColor(MUTED).text(title.toUpperCase(), x, y, { width: colW, characterSpacing: 0.6 });
      let ly = doc.y + 4;
      lines.forEach((line, i) => {
        this.font(doc, i === 0 ? 'semibold' : 'regular').fontSize(9).fillColor(i === 0 ? INK : '#333333').text(line, x, ly, { width: colW });
        ly = doc.y + 1.5;
      });
      return ly;
    };
    const contact = [order.customerName, order.customerPhone, order.alternatePhone ? `Alt: ${order.alternatePhone}` : '', order.customerEmail ?? '']
      .filter(Boolean);
    const address = [
      order.customerName,
      order.address,
      `${order.city}, ${order.state} – ${order.pincode}`,
      order.landmark ? `Landmark: ${order.landmark}` : '',
    ].filter(Boolean);
    const a = block('Billed to', contact, left);
    const b = block('Delivery address', address, left + colW + 24);
    return Math.max(a, b);
  }

  private totals(doc: Doc, order: OrderDetailRow, x: number, y: number, width: number) {
    const rows: [string, string][] = [
      ['Subtotal (MRP)', this.amount(order.subtotal)],
      ['Discount', toNumber(order.discount) > 0 ? `− ${this.amount(order.discount)}` : this.amount(0)],
      ['Shipping', toNumber(order.shippingFee) > 0 ? this.amount(order.shippingFee) : 'Free'],
    ];
    for (const [label, value] of rows) {
      this.font(doc, 'regular').fontSize(9).fillColor(MUTED).text(label, x, y, { width: width * 0.55 });
      this.font(doc, 'regular').fontSize(9).fillColor(INK).text(value, x + width * 0.55, y, { width: width * 0.45, align: 'right' });
      y += 16;
    }
    y += 4;
    doc.roundedRect(x, y, width, 30, 6).fill(INK);
    this.font(doc, 'bold').fontSize(10).fillColor('#FFFFFF').text('TOTAL', x + 12, y + 10, { width: width * 0.4, characterSpacing: 1 });
    this.font(doc, 'bold').fontSize(12).fillColor('#FFFFFF').text(this.amount(order.total), x + width * 0.4, y + 8.5, { width: width * 0.6 - 12, align: 'right' });
    doc.fillColor(INK);
    return y + 30;
  }

  private rule(doc: Doc, x: number, y: number, width: number) {
    doc.moveTo(x, y).lineTo(x + width, y).lineWidth(0.75).strokeColor(LINE).stroke();
  }

  private itemOptions(item: OrderDetailRow['items'][number]): string {
    const options = Array.isArray(item.options)
      ? (item.options as { name?: unknown; value?: unknown }[])
          .filter((o) => typeof o?.name === 'string' && typeof o?.value === 'string')
          .map((o) => `${o.name as string}: ${o.value as string}`)
      : [];
    return options.length ? options.join(' · ') : (item.variantTitle ?? '');
  }

  private storeLines(store: Store): string[] {
    const cityLine = [store.city, store.state].filter(Boolean).join(', ') + (store.pincode ? ` – ${store.pincode}` : '');
    return [store.address ?? '', cityLine, store.phone ? `Phone: ${store.phone}` : '', store.email ? `Email: ${store.email}` : ''].filter(
      (l) => l.trim(),
    );
  }

  private amount(value: Parameters<typeof toNumber>[0]): string {
    const formatted = this.money.format(toNumber(value));
    return this.fonts ? formatted : formatted.replace('₹', 'Rs. ');
  }

  private date(value: Date): string {
    return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: this.config.timezone }).format(value);
  }

  private font(doc: Doc, weight: keyof typeof FONT_FILES) {
    if (this.fonts) return doc.font(`wmt-${weight}`);
    return doc.font(weight === 'regular' ? 'Helvetica' : 'Helvetica-Bold');
  }

  private contentBottom(doc: Doc) {
    return doc.page.height - doc.page.margins.bottom;
  }

  private locateFonts() {
    for (const dir of [resolve(process.cwd(), 'assets/fonts'), resolve(__dirname, '../../assets/fonts'), resolve(__dirname, '../../../assets/fonts')]) {
      const files = {
        regular: resolve(dir, FONT_FILES.regular),
        semibold: resolve(dir, FONT_FILES.semibold),
        bold: resolve(dir, FONT_FILES.bold),
      };
      if (Object.values(files).every((f) => existsSync(f))) return files;
    }
    return null;
  }
}
