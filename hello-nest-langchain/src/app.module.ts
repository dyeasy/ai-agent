/*
 * @Author: jiangxin
 * @Date: 2026-07-31 15:52:11
 * @Company: orientsec.com.cn
 * @Description:
 */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BookModule } from './book/book.module';
import { AiModule } from './ai/ai.module';
import { ConfigModule } from '@nestjs/config';
import path from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';

@Module({
  imports: [
    BookModule,
    AiModule,
    ConfigModule.forRoot({
      // 指定你的 .env 文件路径（相对于项目根目录执行命令的路径）
      envFilePath: '../.env',
      // 设为全局模块，这样其他 Module 就不用重复 import 了
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: path.resolve(__dirname, '..', 'public'),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
