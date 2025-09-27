import { Controller, Get, Param } from '@nestjs/common';
import { PrintService } from './print.service';

@Controller('print')
export class PrintController {
  constructor(private readonly printService: PrintService) {}

  @Get(':id')
  async printOrder(@Param('id') id: string) {
    return this.printService.printKitchenOrder(+id);
  }

  //   @Get('check/:paymentId')
  // async printCheck(@Param('paymentId') paymentId: number) {
  //   return await this.printService.printCustomerCheck(Number(paymentId));
  // }
}
