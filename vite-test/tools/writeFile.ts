import { tool } from "langchain";
import * as z from "zod";
import fs from "node:fs/promises";
import path from "node:path";

export const writeFileTool = tool(
  async ({ filePath, content }) => {
    const dir = path.dirname(filePath);
    console.log('dir', dir);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, content, { encoding: "utf-8" });
    console.log(
      `[工具调用] write_file: 文件路径: ${filePath}, 内容大小: ${content.length} 字节`
    );
    return `文件已写入:\n${filePath}`;
  },
  {
    name: "write_file",
    description:
      "用此工具来写入文件内容，当用户要求写入文件、保存代码、更新文件内容时，调用此工具。输入的文件路径可以是相对/绝对",
    schema: z.object({
      filePath: z.string().describe("要写入的文件路径"),
      content: z.string().describe("要写入的内容")
    })
  }
);

