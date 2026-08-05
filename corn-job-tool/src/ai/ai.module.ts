/*
 * @Author: jiangxin
 * @Date: 2026-08-04 14:10:28
 * @Company: orientsec.com.cn
 * @Description:
 */
import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';

interface IEnv {
  DS_MODE_NAME: string;
  DS_API_KEY: string;
  DS_BASE_URL: string;
}

@Module({
  controllers: [AiController],
  providers: [
    AiService,
    {
      provide: 'CHAT_MODEL',
      useFactory(configService: ConfigService<IEnv>) {
        const model = configService.get('DS_MODE_NAME') as string;
        const apiKey = configService.get('DS_API_KEY') as string;
        const baseURL = configService.get('DS_BASE_URL') as string;
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
