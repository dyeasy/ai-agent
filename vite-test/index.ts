/*
 * @Author: jiangxin
 * @Date: 2026-07-03 14:20:53
 * @Company: orientsec.com.cn
 * @Description:
 */
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "langchain";

import { readFileTool } from "./tools/readFile.ts";
import { writeFileTool } from "./tools/writeFile.ts";

const model = new ChatOpenAI({
  modelName: "qwen3.7-plus",
  apiKey: process.env.API_KEY,
  temperature: 0,
  configuration: {
    baseURL: process.env.BASE_URL
    // other params...
  }
}).bindTools([readFileTool, writeFileTool]);

const message: any[] = [
  new SystemMessage(`你是一个代码助手，可以使用工具读取文件，解释代码，并且还可以写入文件。
            工作流程:
            1:当用户要求创建文件、写入文件时，立即调用write_file 工具
            2:当用户要求读取文件时，立即调用read_file 工具
            3:等待工具返回内容
            4:对返回的内容进行分析，解释

            可用工具
            - read_file:读取文件内容
            - write_file:写入文件内容
        `),
  new HumanMessage(
    `1：请创建一个文件 ./src/util.ts 并写入内容: 函数入参是一个集合，里面是一个一个的对象，对象里有一个 name 属性，这个函数的作用是把集合里的对象按 name 属性进行去重，返回一个新的集合。
     2：之后再读取这个文件并解释代码`
  )
];

async function main() {
  // 核心：使用循环处理多轮对话
  while (true) {
    console.log("\n🤖 模型思考中...");
    const response = await model.invoke(message);
    message.push(response);

    // 如果模型不再调用工具，说明任务完成，跳出循环
    if (!response.tool_calls || response.tool_calls.length === 0) {
      console.log("\n✅ 最终回复:\n", response.content);
      break;
    }

    // 处理工具调用
    for (const toolCall of response.tool_calls) {
      console.log(`\n🔧 正在执行工具 [${toolCall.name}]`);
      
      let toolResult: any;
      if (toolCall.name === "read_file") {
        toolResult = await readFileTool.invoke(toolCall);
      } else if (toolCall.name === "write_file") {
        toolResult = await writeFileTool.invoke(toolCall);
      }
      
      // 必须将工具的结果放入 message 中，模型才能看到刚才发生了什么
      message.push(toolResult);
      console.log("工具执行结果:", toolResult.content);
    }
    break;
  }
}

main();

