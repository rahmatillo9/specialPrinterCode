import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { print } from 'pdf-to-printer';
import * as fs from 'fs';
import { join } from 'path';
import PDFDocument = require('pdfkit');

@Injectable()
export class PrintService {
  private readonly API_URL = 'http://192.168.1.8:5500';
  private readonly TOKEN =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsIm5hbWUiOiJBZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1NzUwODc4MSwiZXhwIjoxNzU3NTk1MTgxfQ.WMtgua3T6eoJvTLQjCG5Q_BgKQMCtsU8f86E9Ai0GA8';

  constructor(private readonly http: HttpService) {}

async printKitchenOrder(order: any): Promise<string> {
  const pdfPath = join(process.cwd(), `kitchen-order-${order.id}.pdf`);

  if (!order.items || !Array.isArray(order.items)) {
    console.error('❌ Order.items topilmadi yoki noto‘g‘ri format:', order);
    return '⚠️ Buyurtma ichida itemlar yo‘q!';
  }

  // 🔹 faqat chop etilmagan yangi itemlar
  const itemsToPrint = order.items.filter((item) => !item.isPrinted && item.status !== 'canceled');
  // 🔹 canceled bo‘lgan itemlar (isPrinted bo‘lsa ham qaytadan chiqishi kerak!)
  const canceledItems = order.items.filter((item) => item.status === 'canceled');

  if (itemsToPrint.length === 0 && canceledItems.length === 0) {
    return 'ℹ️ Yangi ham, bekor qilingan ham taom yo‘q.';
  }

  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({
      size: [226, 600],
      margins: { top: 10, left: 10, right: 10, bottom: 10 },
    });

    const fontPath = join(process.cwd(), 'fonts', 'DejaVuSans.ttf');
    doc.font(fontPath);

    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    doc.fontSize(16).text('Super Ofitsiant - Oshxona', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Stol: ${order.table?.table_number} (${order.table?.location})`);
    doc.text(`Order ID: ${order.id}`);
    doc.text(`Vaqt: ${new Date(order.createdAt).toLocaleString()}`);
    doc.moveDown();
    doc.moveTo(10, doc.y).lineTo(216, doc.y).stroke();

    // 🔹 Yangi itemlar
    if (itemsToPrint.length > 0) {
      doc.fontSize(14).text('🆕 Yangi buyurtmalar:', { underline: true });
      itemsToPrint.forEach((item) => {
        doc.fontSize(14).text(`${item.quantity}x ${item.product?.name ?? 'Noma’lum'}`);
      });
      doc.moveDown();
    }

    // 🔹 Bekor qilingan itemlar
    if (canceledItems.length > 0) {
      doc.fontSize(14).fillColor('red').text('❌ Bekor qilingan:', { underline: true });
      canceledItems.forEach((item) => {
        doc.fontSize(14).text(`${item.quantity}x ${item.product?.name ?? 'Noma’lum'}`);
      });
      doc.fillColor('black');
    }

    doc.end();

    stream.on('finish', () => resolve());
    stream.on('error', (err) => reject(err));
  });

  await print(pdfPath, { printer: 'XP-80C' });
  fs.unlinkSync(pdfPath);

  // 🔹 Yangi itemlarni `isPrinted = true` qilamiz
  for (const item of itemsToPrint) {
    try {
      await this.http.put(
        `${this.API_URL}/order-items/${item.id}`,
        { isPrinted: true },
        { headers: { Authorization: `Bearer ${this.TOKEN}` } },
      ).toPromise();
    } catch (err) {
      console.error(`❌ Item #${item.id} update bo‘lmadi:`, err.message);
    }
  }

  return '✅ Oshxona uchun buyurtma chiqarildi!';
}




// src/print/print.service.ts
async printCustomerCheckSocket(check: any): Promise<string> {
  // Fayl nomini user.name bilan yaratamiz
  const fileSafeName = check.user?.name?.replace(/\s+/g, '_') || `order-${check.orderId}`;
  const pdfPath = join(process.cwd(), `customer-check-${fileSafeName}.pdf`);

  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({
      size: [226, 600],
      margins: { top: 10, left: 10, right: 10, bottom: 10 },
    });

    const fontPath = join(process.cwd(), 'fonts', 'DejaVuSans.ttf');
    doc.font(fontPath);

    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    doc.fontSize(16).text('Super Ofitsiant', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).text('Mijoz uchun chek', { align: 'center' });
    doc.moveDown();
    doc.moveTo(10, doc.y).lineTo(216, doc.y).stroke();

    doc.fontSize(12).text(`Stol: ${check.table}`);
    // ❌ Oldingi: Buyurtma ID
    // doc.text(`Buyurtma ID: ${check.orderId}`);
    // ✅ Yangi: Ofitsiant ismi
    doc.text(`Ofitsiant: ${check.paidByName|| 'Nomaʼlum'}`);
    console.log(check);
    
    doc.text(`Vaqt: ${new Date(check.orderTime).toLocaleString()}`);
    doc.moveDown();
    doc.moveTo(10, doc.y).lineTo(216, doc.y).stroke();

    check.items.forEach((item) => {
      doc.fontSize(12).text(
        `${item.quantity}x ${item.productName} .... ${item.total} so'm`,
      );
    });

    doc.moveDown();
    doc.moveTo(10, doc.y).lineTo(216, doc.y).stroke();

    doc.fontSize(12).text(`Umumiy: ${check.totalAmount} so'm`, { align: 'right' });
    doc.fontSize(12).text(`Xizmat haqi: ${check.serviceFee} so'm`, { align: 'right' });
    doc.fontSize(14).text(`Jami: ${check.paidAmount} so'm`, { align: 'right' });
    doc.moveDown(2);

    doc.fontSize(12).text('Rahmat sizga! :)', { align: 'center' });
    doc.fontSize(10).text('Yana kutib qolamiz!', { align: 'center' });

    doc.end();

    stream.on('finish', () => resolve());
    stream.on('error', (err) => reject(err));
  });

  // 🔹 Printerga yuborish
  await print(pdfPath, { printer: 'XP-80C' });

  fs.unlinkSync(pdfPath);
  return '✅ Mijoz uchun chek chiqarildi!';
}




}
