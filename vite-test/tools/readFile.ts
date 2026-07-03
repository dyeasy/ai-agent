/*
 * @Author: jiangxin
 * @Date: 2026-07-03 14:22:25
 * @Company: orientsec.com.cn
 * @Description: 
 */
import { tool } from "langchain";
import fs from "node:fs/promises";
import * as z from "zod";

export const readFileTool = tool(
  async ({ filePath }) => {
    const content = await fs.readFile(filePath, { encoding: "utf-8" });
    console.log(`[工具调用] read_file: 文件路径: ${filePath}, 内容大小: ${content.length} 字节`);
    return `文件内容:\n${content}`;
  },
  {
    name: "read_file",
    description:
      "用此工具来读取文件内容，当用户要求读取文件、查看代码、分析文件内容时，调用此工具。输入的文件路径可以是相对/绝对",
    schema: z.object({
      filePath: z.string().describe("要读取的文件路径")
    })
  }
);