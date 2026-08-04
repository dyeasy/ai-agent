/*
 * @Author: jiangxin
 * @Date: 2026-08-03 15:17:00
 * @Company: orientsec.com.cn
 * @Description:
 */
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { Runnable } from '@langchain/core/runnables';
import { ChatOpenAI, ChatOpenAICallOptions } from '@langchain/openai';
import { Inject, Injectable } from '@nestjs/common';
@Injectable()
export class AiService {
  private chain: Runnable<{ question: string }, string>;

  constructor(@Inject('CHAT_MODEL') model: ChatOpenAI<ChatOpenAICallOptions>) {
    const prompt = PromptTemplate.fromTemplate(`请回答以下问题：\n{question}`);

    this.chain = prompt.pipe(model).pipe(new StringOutputParser());
  }

  async runChain(question: string) {
    return this.chain.invoke({ question });
  }

  async *streamChain(question: string) {
    const res = await this.chain.stream({ question });
    for await (const chunk of res) {
      yield chunk;
    }
  }
}
