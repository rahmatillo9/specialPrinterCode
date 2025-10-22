// src/orders/order-client.gateway.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import { PrintService } from '../print/print.service';

@Injectable()
export class OrderClientGateway implements OnModuleInit {
  private socket: Socket;

  constructor(private readonly printService: PrintService) {}

  onModuleInit() {
    // 🔗 Asosiy serverga ulanamiz
this.socket = io(`${process.env.BEST_URL}/order`, {
  transports: ["websocket"],
  path: "/order"  // nginx location bilan bir xil
});



    this.socket.on('connect', () => {
      console.log('✅ Oshxona socket serverga ulandi!');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Oshxona socketdan uzildi!');
    });

    // 🔹 Order print qilish eventini olish
    this.socket.on('print-order', async (order) => {
      console.log('🖨️ Chop etish uchun order keldi:', order.id);
      await this.printService.printKitchenOrder(order);
    });

    // 🔹 Agar xohlasang yangi order eventini ham tutib olasan
    this.socket.on('new-order', async (order) => {
      console.log('🍽️ Yangi buyurtma keldi:', order.id);
      await this.printService.printKitchenOrder(order);
    });
  }
}