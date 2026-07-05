/*
 * @Author: jiangxin
 * @Date: 2026-07-03 15:38:28
 * @Company: orientsec.com.cn
 * @Description:
 */
import { tool } from "langchain";
import * as z from "zod";
import { spawn } from "child_process";

export const executeCommandTool = tool(
  async ({ command, workingDir }) => {
    const cwd = workingDir || process.cwd();
    console.log(
      `[工具调用] execute_command: 命令: ${command}  工作目录: ${cwd}`
    );
    return new Promise((resolve, reject) => {
      const [cmd, ...arg] = command.split(" ");
      const child = spawn(cmd, arg, {
        shell: true,
        stdio: "inherit",
        cwd
      });

      child.on("close", (code) => {
        if (code === 0) {
          resolve(`命令执行成功: ${command}`);
        } else {
          // ✅ 把错误变成字符串，让 AI 自己看到并尝试修复！
          resolve(
            `命令 "${command}" 执行失败，退出码: ${code}。请根据报错信息分析原因并尝试修复！`
          );
        }
      });

      child.on("error", (err) => {
        // ✅ 系统级错误也交回给 AI
        resolve(`系统错误，无法执行命令: ${err.message}`);
      });
    });
  },
  {
    name: "execute_command",
    description:
      "用此工具来执行系统命令，当用户要求执行系统命令、运行脚本、调用外部程序时，调用此工具。输入的命令可以是任何有效的系统命令。",
    schema: z.object({
      command: z.string().describe("要执行的系统命令"),
      workingDir: z.string().describe("工作目录")
    })
  }
);

