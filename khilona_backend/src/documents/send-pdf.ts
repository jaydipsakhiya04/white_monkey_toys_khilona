import type { Response } from 'express';
import type { GeneratedDocument } from './documents.service';

/** Streams a generated PDF as a private, non-cacheable download. */
export function sendPdf(res: Response, doc: GeneratedDocument) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${doc.filename.replace(/[^\w.-]/g, '_')}"`);
  res.setHeader('Content-Length', String(doc.buffer.length));
  res.setHeader('Cache-Control', 'private, no-store');
  res.end(doc.buffer);
}
