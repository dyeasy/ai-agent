/*
 * @Author: jiangxin
 * @Date: 2026-08-04 14:10:28
 * @Company: orientsec.com.cn
 * @Description:
 */
import { tool } from '@langchain/core/tools';
import { ChatOpenAI, ChatOpenAICallOptions } from '@langchain/openai';
import { Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';

const database = {
  users: {
    '001': {
      id: '001',
      name: '张三',
      email: 'zhangsan@example.com',
      role: 'admin',
    },
    '002': { id: '002', name: '李四', email: 'lisi@example.com', role: 'user' },
    '003': {
      id: '003',
      name: '王五',
      email: 'wangwu@example.com',
      role: 'user',
    },
  },
};

const queryUserArgsSchema = z.object({
  userId: z.string().describe('用户 ID，例如: 001, 002, 003'),
});

const queryUserTool = tool(
  ({ userId }) => {
    const user = database.users[userId];
  },
  {
    name: 'query_user',
    description:
      '查询数据库中的用户信息。输入用户 ID，返回该用户的详细信息（姓名、邮箱、角色）。',
    schema: queryUserArgsSchema,
  },
);

@Injectable()
export class AiService {
  constructor(@Inject('CHAT_MODEL') mode: ChatOpenAI<ChatOpenAICallOptions>) {
    mode.bindTools([queryUserTool]);
  }

  async runChain(){
    
  }
}
