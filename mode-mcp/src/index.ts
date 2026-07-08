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
import { HumanMessage, SystemMessage, ToolMessage } from "langchain";
import chalk from "chalk";
import * as readline from "readline/promises";
import { fileURLToPath } from "url";
import { createRequire } from "module";

// 1. 获取当前这段代码所在文件的绝对路径
const __filename = fileURLToPath(import.meta.url);
// 2. 获取当前文件所在的目录路径
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);
// 精准找到 filesystem 服务底层的可执行文件路径
const fsServerPath =
  require.resolve("@modelcontextprotocol/server-filesystem/dist/index.js");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const mcppath = path.resolve(__dirname, "../../hello-mcp/src/index.ts");

const mcpclient = new MultiServerMCPClient({
  mcpServers: {
    "my-mcp": {
      command: "node",
      args: [mcppath]
    },
    // 这是高德的地图 mcp 服务
    "amap-maps-streamableHTTP": {
      url: "https://mcp.amap.com/mcp?key=96721f671ffba725e9aafb3d0ec1114c"
    },
    filesystem_local: {
      command: "node",
      args: [
        fsServerPath, // 指向本地 node_modules 里的脚本
        path.resolve(__dirname, "..") // 你的白名单目录
      ]
    },
    // filesystem: {
    //   command: "npx",
    //   args: [
    //     "-y",
    //     "@modelcontextprotocol/server-filesystem",
    //     path.resolve(__dirname, "..")
    //   ]
    // }
    "chrome-devtools": {
      command: "npx",
      args: ["-y", "chrome-devtools-mcp@latest"]
    }
  }
});
const mytools = await mcpclient.getTools();
// 阿里千问模型
// const modeInstance = new ChatOpenAI({
//   modelName: "qwen3.7-plus",
//   apiKey: process.env.API_KEY,
//   temperature: 0,
//   configuration: {
//     baseURL: process.env.BASE_URL
//   }
// }).bindTools(mytools);
// 智谱模型
const modeInstance = new ChatOpenAI({
  modelName: "glm-4.7",
  apiKey: process.env.Z_API_KEY,
  temperature: 0,
  configuration: {
    baseURL: process.env.Z_BASE_URL
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

const mapsSystemMessage = new SystemMessage(
  "每一轮对话中，最多只能同时发起3个maps_工具调用;如果需要查询超过3个地点，必须分批执行:每批最多3个，等上一批全部返回结果后，再发起下一批; -严禁在同一轮中一次性发起超过3个maps_工具调用"
);

const message: any[] = [
  new SystemMessage(resourceContent.join("")),
  mapsSystemMessage
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
          console.log(chalk.bgGreenBright(`调用工具: ${currentTool.name}`));
          const toolResponse = await currentTool.invoke(toolCall.args);

          let contentStr = "";
          if (typeof toolResponse == "string") {
            contentStr = toolResponse;
          } else if (!!toolResponse && toolResponse?.text) {
            contentStr = toolResponse?.text;
          }
          message.push(
            new ToolMessage({
              content: contentStr,
              tool_call_id: toolCall.id!, // 【极其重要】大模型靠这个 ID 把结果和之前的请求匹配起来
              name: toolCall.name // 可选，但建议带上工具名称
            })
          );
        }
      }
    }
  }

  await mcpclient.close();
  console.log(chalk.greenBright("任务执行完成！"));
})();

