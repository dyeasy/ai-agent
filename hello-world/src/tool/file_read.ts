/*
 * @Author: jiangxin
 * @Date: 2026-06-28 14:14:09
 * @Company: orientsec.com.cn
 * @Description:
 */
import fs from "node:fs/promises";
import { tool } from "langchain";
import * as z from "zod";

export const readFile = tool(
  async ({ filePath }) => {
    console.log('文件路径',filePath)
    const content = await fs.readFile(filePath, { encoding: "utf-8" });
    return `文件内容:${content}`;
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

