import { Module } from '@nestjs/common';

import * as dotenv from "dotenv";
import { PrintModule } from './print/print.module';

dotenv.config();
@Module({
  imports: [

  
   PrintModule


  ],

})
export class AppModule {}


  