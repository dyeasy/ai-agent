/*
 * @Author: jiangxin
 * @Date: 2026-07-05 16:25:09
 * @Company: orientsec.com.cn
 * @Description:
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod";

const service = new McpServer({
  name: "hello-mcp",
  version: "1.0.0"
});

service.registerTool(
  "add-numbers",
  {
    description: "这是一个计算两个数之和的工具",
    inputSchema: {
      number1: z.number().describe("第一个数字"),
      number2: z.number().describe("第二个数字")
    }
  },
  async (a) => {
    return {
      content: [
        {
          type: "text",
          text: `计算结果是: ${a.number1 + a.number2}，太棒了！`
        }
      ]
    };
  }
);

const transport = new StdioServerTransport();
service.connect(transport);

