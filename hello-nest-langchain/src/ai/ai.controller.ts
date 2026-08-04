/*
 * @Author: jiangxin
 * @Date: 2026-08-03 15:17:00
 * @Company: orientsec.com.cn
 * @Description:
 */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Sse,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { endWith, from, map } from 'rxjs';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('chat')
  async chat(@Query('question') question: string) {
    const res = await this.aiService.runChain(question);
    return {
      result: res,
    };
  }

  @Sse('chat/stream')
  chatStream(@Query('question') question: string) {
    return from(this.aiService.streamChain(question)).pipe(
      map((chunk) => {
        console.log(chunk);
        return { type: 'message', data: chunk };
      }),
      endWith({
        type: 'done',
        data: 'completed',
      }),
    );
  }

  //   @Post()
  //   create(@Body() createAiDto: CreateAiDto) {
  //     return this.aiService.create(createAiDto);
  //   }

  //   @Get()
  //   findAll() {
  //     return '1111';
  //   }

  //   @Get(':id')
  //   findOne(@Param('id') id: string) {
  //     return this.aiService.findOne(+id);
  //   }

  //   @Patch(':id')
  //   update(@Param('id') id: string, @Body() updateAiDto: UpdateAiDto) {
  //     return this.aiService.update(+id, updateAiDto);
  //   }

  //   @Delete(':id')
  //   remove(@Param('id') id: string) {
  //     return this.aiService.remove(+id);
  //   }
}
