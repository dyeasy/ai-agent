/*
 * @Author: jiangxin
 * @Date: 2026-08-04 14:08:06
 * @Company: orientsec.com.cn
 * @Description:
 */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiModule } from './ai/ai.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    AiModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
