/*
 * @Author: jiangxin
 * @Date: 2026-07-06 15:31:19
 * @Company: orientsec.com.cn
 * @Description:
 */
import { ChatOpenAI } from "@langchain/openai";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import process from "process";
import path from "path";
import { HumanMessage, SystemMessage } from "langchain";
import chalk from "chalk";
import * as readline from "readline/promises";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const mcppath = path.join(
  path.resolve(process.cwd(), ".."),
  "hello-mcp",
  "src/index.ts"
);

const mcpclient = new MultiServerMCPClient({
  mcpServers: {
    "my-mcp": {
      command: "node",
      args: [mcppath]
    }
  }
});
const mytools = await mcpclient.getTools();

const modeInstance = new ChatOpenAI({
  modelName: "qwen3.7-plus",
  apiKey: process.env.API_KEY,
  temperature: 0,
  configuration: {
    baseURL: process.env.BASE_URL
  }
}).bindTools(mytools);

const list = await mcpclient.listResources();
const resourceContent: (string | undefined)[] = [];
for (const [name, resources] of Object.entries(list)) {
  for (const resource of resources) {
    const content = await mcpclient.readResource(name, resource.uri);
    resourceContent.push(content[0].text);
  }
}

resourceContent.filter(Boolean);

const message: any[] = [
    new SystemMessage(resourceContent.join(""))
];

(async function () {
  console.log(chalk.greenBright("欢迎使用代码助手！"));
  console.log(chalk.greenBright("请输入任务描述，按回车键提交:"));
  while (true) {
    const taskDescription = await rl.question(chalk.yellowBright("> "));
    if (taskDescription.trim().toLowerCase() === "exit") {
      console.log("拜拜！👋");
      rl.close();
      break;
    }
    message.push(new HumanMessage(taskDescription));
    console.log(chalk.greenBright("开始执行任务..."));
    while (true) {
      const response = await modeInstance.invoke(message);
      message.push(response);
      if (!response.tool_calls?.length) {
        console.log(response.content);
        console.log(chalk.greenBright("任务执行完成！"));
        break;
      }

      for (const toolCall of response.tool_calls) {
        const currentTool = mytools.find((f) => f.name === toolCall.name);
        if (!!currentTool) {
          console.log(chalk.yellowBright(`调用工具: ${currentTool.name}`));
          const toolResponse = await currentTool.invoke(toolCall.args);
          console.log(
            chalk.blueBright(
              `工具 ${currentTool.name} 执行结果: ${toolResponse}`
            )
          );
          message.push(toolResponse);
        }
      }
    }
  }

  await mcpclient.close();
  console.log(chalk.greenBright("任务执行完成！"));
})();

