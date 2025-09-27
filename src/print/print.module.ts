import { Module } from '@nestjs/common';
import { PrintService } from './print.service';
import { PrintController } from './print.controller';
import { HttpModule } from '@nestjs/axios';
import { OrderClientGateway } from './order-client.gateway';
import { PaymentsClientGateway } from './paymet.gatway';

@Module({
  imports: [HttpModule], // ✅ HttpModule shu yerdan kelyapti
  providers: [PrintService, OrderClientGateway, PaymentsClientGateway],
  controllers: [PrintController],
})
export class PrintModule {}
