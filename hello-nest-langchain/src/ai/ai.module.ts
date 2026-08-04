/*
 * @Author: jiangxin
 * @Date: 2026-08-03 15:17:00
 * @Company: orientsec.com.cn
 * @Description:
 */
import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';

interface IEnv {
  MODE_NAME: string;
  API_KEY: string;
  BASE_URL: string;
}

@Module({
  controllers: [AiController],
  providers: [
    AiService,
    {
      provide: 'CHAT_MODEL',
      useFactory(configService: ConfigService<IEnv>) {
        const model = configService.get('MODE_NAME') as string;
        const apiKey = configService.get('API_KEY') as string;
        const baseURL = configService.get('BASE_URL') as string;
        return new ChatOpenAI(model, {
          apiKey,
          configuration: {
            baseURL,
          },
        });
      },
      inject: [ConfigService],
    },
  ],
})
export class AiModule {}
