import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { print } from 'pdf-to-printer';
import * as fs from 'fs';
import { join } from 'path';
import PDFDocument = require('pdfkit');
import * as dotenv from 'dotenv';

dotenv.config();
@Injectable()
export class PrintService {
  private readonly API_URL = process.env.BEST_URL;
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
    const itemsToPrint = order.items.filter(
      (item) => !item.isPrinted && item.status !== 'canceled'
    );
  
    // 🔹 canceled bo‘lgan itemlar (isPrinted bo‘lsa ham qaytadan chiqishi kerak)
    const canceledItems = order.items.filter(
      (item) => !item.isPrinted && item.status === 'canceled'
    );
  
    if (itemsToPrint.length === 0 && canceledItems.length === 0) {
      return 'ℹ️ Yangi ham, bekor qilingan ham taom yo‘q.';
    }
  
    await new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument({
        size: [240, 600],
        margins: { top: 10, left: 5, right: 5, bottom: 10 },
      });
  
      const fontPath = join(process.cwd(), 'fonts', 'DejaVuSans.ttf');
      doc.font(fontPath);
  
      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);
  
      // 🔹 Sarlavha
      doc.fontSize(16).text('CHEK - Oshxona', { align: 'center' });
      doc.moveDown();
  
      // 🔹 Buyurtma haqida
      doc.fontSize(12).text(`Stol: ${order.table?.table_number} (${order.table?.location})`);
      doc.text(`Ofitsiant: ${order.user?.name || 'Nomaʼlum'}`);
      doc.text(`Vaqt: ${new Date(order.createdAt).toLocaleString()}`);
      doc.moveDown();
      doc.moveTo(10, doc.y).lineTo(216, doc.y).stroke();
  
      // 🔹 birliklar uchun lug‘at
      const unitLabels: Record<string, string> = {
        piece: 'dona',
        kg: 'kg',
        gr: 'gr',
        liter: 'litr',
      };
  
      const formatQuantity = (qty: any) => {
        const num = Number(qty);
        if (isNaN(num)) return qty;
        return Number.isInteger(num) ? num.toString() : num.toFixed(2);
      };
  
      // 🔹 Yangi itemlar
      if (itemsToPrint.length > 0) {
        doc.moveDown().fontSize(14).text('🆕 Yangi buyurtmalar:', { underline: true });
  
        itemsToPrint.forEach((item) => {
          const unit = unitLabels[item.product.unitType] || item.product.unitType || '';
          const qty = formatQuantity(item.quantity);
          doc.fontSize(14).text(`${qty} ${unit} x ${item.product?.name ?? 'Noma’lum'}`);
        });
      }
  
      // 🔹 Bekor qilingan itemlar
      if (canceledItems.length > 0) {
        doc.moveDown().fontSize(14).fillColor('red').text('❌ Bekor qilingan:', { underline: true });
  
        canceledItems.forEach((item) => {
          const unit = unitLabels[item.product.unitType] || item.product.unitType || '';
          const qty = formatQuantity(item.quantity);
          doc.fontSize(14).text(`${qty} ${unit} x ${item.product?.name ?? 'Noma’lum'}`);
        });
  
        doc.fillColor('black');
      }
  
      doc.end();
  
      stream.on('finish', () => resolve());
      stream.on('error', (err) => reject(err));
    });
  
    // 🔹 printerga chiqarish
    await print(pdfPath, { printer: `${process.env.CITCHEN_PRINTER}` });
    fs.unlinkSync(pdfPath);
  
    // 🔹 Yangi itemlarni isPrinted = true qilish
// 🔹 Yangi va bekor qilingan itemlarni isPrinted = true qilish
const printedItems = [...itemsToPrint, ...canceledItems];
for (const item of printedItems) {
  try {
    await this.http.put(
      `${this.API_URL}/order-items/${item.id}`,
      { isPrinted: true },
      { headers: { Authorization: `Bearer ${this.TOKEN}` } }
    ).toPromise();
  } catch (err: any) {
    console.error(`❌ Item #${item.id} update bo‘lmadi:`, err.message);
  }
}

  
    return '✅ Oshxona uchun buyurtma chiqarildi!';
  }
  



// src/print/print.service.ts
async printCustomerCheckSocket(check: any): Promise<string> {
  const fileSafeName =
    check.user?.name?.replace(/\s+/g, "_") || `order-${check.orderId}`;
  const pdfPath = join(process.cwd(), `customer-check-${fileSafeName}.pdf`);

  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({
      size: [270, 650],
      margins: { top: 10, left: 10, right: 10, bottom: 10 },
    });

    const fontPath = join(process.cwd(), "fonts", "DejaVuSans.ttf");
    doc.font(fontPath);

    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    // 🧩 Sarlavha
    doc.fontSize(16).text("CHEK", { align: "center", width: 250, bold: true });
    doc.moveDown(0.3);
    doc.fontSize(11).text("Mijoz uchun chek", { align: "center", width: 250 });
    doc.moveDown(0.5);
    doc.moveTo(10, doc.y).lineTo(250, doc.y).stroke();

    // 🧩 Buyurtma ma’lumotlari
    doc.fontSize(10).text(`Stol: ${check.table}`);
    doc.text(`Ofitsiant: ${check.paidByName || "Nomaʼlum"}`);
    doc.text(`Vaqt: ${new Date(check.orderTime).toLocaleString()}`);
    doc.moveDown(0.5);
    doc.moveTo(10, doc.y).lineTo(250, doc.y).stroke();

    // 🧩 Bir xil mahsulotlarni birlashtirish
    const mergedItems: Record<string, any> = {};
    check.items.forEach((item) => {
      const key = `${item.productName}-${item.unitType}`;
      if (!mergedItems[key]) {
        mergedItems[key] = { ...item };
      } else {
        mergedItems[key].quantity += item.quantity;
        mergedItems[key].total += item.total;
      }
    });

    const unitLabels: Record<string, string> = {
      piece: "dona",
      kg: "kg",
      gr: "gr",
      liter: "litr",
    };

    // 🧾 Jadval sarlavhalari
    doc.moveDown(0.3);
    const headerY = doc.y; // header uchun yagona y pozitsiya
    doc.fontSize(11);
    doc.text("Mahsulot", 10, headerY);
    doc.text("Miqdor", 150, headerY, { width: 50, align: "right" });
    doc.text("Jami", 200, headerY, { width: 50, align: "right" });
    doc.moveDown(0.8); // pastga biroz joy qoldiramiz
    doc.moveTo(10, doc.y).lineTo(250, doc.y).stroke();
    

    // 🧾 Har bir itemni chiqarish
    Object.values(mergedItems).forEach((item: any) => {
      const unit = unitLabels[item.unitType] || item.unitType || "";
      const quantity = `${item.quantity} ${unit}`;
      const total = `${item.total} S`;

      const y = doc.y + 2;
      doc.fontSize(10).text(item.productName, 10, y, { width: 130 });
      doc.text(quantity, 150, y, { width: 40, align: "right" });
      doc.text(total, 200, y, { width: 50, align: "right" });
      doc.moveDown(0.5);
    });

    doc.moveTo(10, doc.y).lineTo(250, doc.y).stroke();
    doc.moveDown(0.3);

    // 🧮 Summalar
    const addRow = (label: string, value: string | number, bold = false) => {
      const y = doc.y;
      doc.fontSize(bold ? 12 : 10).text(label, 10, y, { width: 120, align: "left" });
      doc.text(value.toString(), 130, y, { width: 110, align: "right" });
      doc.moveDown(0.4);
    };
    

    addRow("Umumiy", `${check.totalAmount} S`);
    if (check.serviceFee) addRow("Xizmat haqi", `${check.serviceFee} S`);
    doc.moveDown(0.2);
    doc.moveTo(10, doc.y).lineTo(250, doc.y).stroke();
    addRow("JAMI", `${check.paidAmount} S`, true);

    doc.moveDown(1);
    doc.fontSize(10).text("Rahmat sizga! :)", { align: "center" });
    doc.fontSize(9).text("Yana kutib qolamiz!", { align: "center" });

    doc.end();

    stream.on("finish", () => resolve());
    stream.on("error", (err) => reject(err));
  });

  await print(pdfPath, { printer: `${process.env.CITCHEN_PRINTER}` });

  fs.unlinkSync(pdfPath);
  return "✅ Mijoz uchun chek chiqarildi!";
}





}
