/*
 * @Author: jiangxin
 * @Date: 2026-06-28 10:03:37
 * @Company: orientsec.com.cn
 * @Description:
 */
import process from "node:process";
import { ChatOpenAI } from "@langchain/openai";
import { readFile } from "./tool/file_read.ts";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const model = new ChatOpenAI({
  modelName: "qwen3.7-plus",
  apiKey: process.env.API_KEY,
  temperature: 0,
  configuration: {
    baseURL: process.env.BASE_URL
    // other params...
  }
}).bindTools([readFile]);

const message: any[] = [
  new SystemMessage(`你是一个代码助手，可以使用工具读取文件并解释代码。
            工作流程:
            1:当用户要求读取文件时，立即调用read_file 工具
            2:等待工具返回内容
            3:对返回的内容进行分析，解释

            可用工具
            - read_file:读取文件内容
        `),
  new HumanMessage("请读取 ./src/test.ts 文件")
];

async function main() {
  const response = await model.invoke(message);
  message.push(response);

  if (!!response.tool_calls?.length) {
    for (const toolCall of response.tool_calls) {
      if (toolCall.name === "read_file") {
        console.log(
          `\n🔧 正在执行工具 [${toolCall.name}], 参数:`,
          toolCall.args
        );
        const result = await readFile.invoke(toolCall);
        console.log("resultresult", result);
        message.push(result);
      }
    }

    console.log("\n🤖 模型第二回合思考结果: 分析代码中...");
    const finalResponse = await model.invoke(message);

    console.log("\n✅ 最终回复:\n", finalResponse.content);
  }
}

main();

