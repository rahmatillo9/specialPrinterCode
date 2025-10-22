// src/payments/payments-client.gateway.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import { PrintService } from '../print/print.service';
import * as dotenv from 'dotenv';

dotenv.config();
@Injectable()
export class PaymentsClientGateway implements OnModuleInit {
  private socket: Socket;

  constructor(private readonly printService: PrintService) {}

  onModuleInit() {
    // 🔗 Asosiy serverga ulanamiz (5503/payment)
this.socket = io(`${process.env.BEST_URL}/payment`, {
  transports: ["websocket"],
  path: "/payment"
});


    this.socket.on('connect', () => {
      console.log('✅ Chek socket serverga ulandi!');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Chek socketdan uzildi!');
    });

    // 🧾 Mijoz uchun yangi chek
    this.socket.on('new-check', async (check) => {
      console.log('🧾 Yangi chek keldi:', check.orderId);
      await this.printService.printCustomerCheckSocket(check);
    });

    // 🖨️ Chekni qayta chop etish
    this.socket.on('print-check', async (check) => {
      console.log('🖨️ Chekni qayta chop etish eventi:', check.orderId);
      await this.printService.printCustomerCheckSocket(check);
    });
  }
}