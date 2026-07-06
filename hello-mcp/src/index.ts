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

const database = {
  users: {
    "001": {
      name: "张三",
      age: 18
    },
    "002": {
      name: "李四",
      age: 20
    },
    "003": {
      name: "王五",
      age: 22
    }
  }
};

service.registerTool(
  "query-user",
  {
    description: "这是一个查询用户信息的工具",
    inputSchema: {
      userId: z.enum(["001", "002", "003"])
    }
  },
  async (a) => {
    const user = database.users[a.userId];
    if (!user) {
      return {
        content: [
          {
            type: "text",
            text: "用户不存在"
          }
        ]
      };
    }
    return {
      content: [
        {
          type: "text",
          text: `用户信息是: ${user.name}, 年龄: ${user.age}`
        }
      ]
    };
  }
);

service.registerResource(
  "使用指南",
  "docs://guide",
  {
    description: "MCP 服务端的用户",
    mimeType: "text/plain"
  },
  async () => {
    return {
      contents: [
        {
          uri: "docs://guide",
          mimeType: "text/plain",
          text: `
                    欢迎使用 hello-mcp 服务端！

                    这是一个示例服务端，提供了一个查询用户信息的工具。

                    使用方法：
                    1. 调用工具 query-user，传入 userId 参数，值为 001、002 或 003。
                    2. 服务端会返回对应的用户信息。

                    示例：
                    调用 query-user 工具，传入 userId=001，服务端会返回:
                    "用户信息是: 张三, 年龄: 18"

                    调用 query-user 工具，传入 userId=004，服务端会返回:
                    "用户不存在"
                `
        }
      ]
    };
  }
);

const transport = new StdioServerTransport();
service.connect(transport);

