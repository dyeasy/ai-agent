/*
 * @Author: jiangxin
 * @Date: 2026-07-03 14:20:53
 * @Company: orientsec.com.cn
 * @Description:
 */
import { ChatOpenAI } from "@langchain/openai";
// import { HumanMessage, SystemMessage } from "langchain";

import { readFileTool } from "./tools/readFile.ts";
import { writeFileTool } from "./tools/writeFile.ts";
import { executeCommandTool } from "./tools/executecommand.ts";

import path from "path";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

console.log("当前工作目录:", process.cwd());

const workspaceRoot = path.resolve(process.cwd(), "..");

console.log("Workspace 根目录:", workspaceRoot);

const model = new ChatOpenAI({
  modelName: "qwen3.7-plus",
  apiKey: process.env.API_KEY,
  temperature: 0,
  configuration: {
    baseURL: process.env.BASE_URL
    // other params...
  }
}).bindTools([readFileTool, writeFileTool, executeCommandTool]);

const case1 = `创建一个功能丰富的 React TodoList 应用 这个项目应该创建的位置是位于 vite-test 目录的同级目录，不要创建到 vite-test目录中：

1. 创建项目：echo -e "\n\n" | pnpm create vite react-todo-app --template react-ts
2. 修改 src/App.tsx，实现完整功能的 TodoList：
- 添加、删除、编辑、标记完成
- 分类筛选（全部/进行中/已完成）
- 统计信息显示
- localStorage 数据持久化
3. 添加复杂样式：
- 渐变背景（蓝到紫）
- 卡片阴影、圆角
- 悬停效果
4. 添加动画：
- 添加/删除时的过渡动画
- 使用 CSS transitions

注意：使用 pnpm，功能要完整，样式要美观，要有动画效果

之后在 react-todo-app 项目中：
1. 使用 pnpm install 安装依赖
2. 使用 pnpm run dev 启动服务器
`;

async function main(caseContent: string) {
  // 核心：使用循环处理多轮对话
  const message: any[] = [
    new SystemMessage(`
        你是一个代码助手，使用工具完成任务。

        【目录环境说明】
        - 当前 Agent 运行目录: ${process.cwd()} (这是 vite-test 目录)
        - Workspace 根目录: ${workspaceRoot} (这是 ai-agent 目录)

        【工具使用说明】
        - read_file:读取文件内容
        - write_file:写入文件内容
        - execute_command:执行命令(支持 workingDir 参数指定工作目录)

        【execute_command 工具重要规则】
        - 这个工具有一个入参 workingDir，表示命令执行的工作目录。
        - 务必按要求在正确的 workingDir 下执行命令！
        - 错误示例: { command:"cd ../ && pnpm create ...", workingDir: "${process.cwd()}" }  
        - 正确示例: { command:"pnpm create ...", workingDir: "${workspaceRoot}" }
        `),
    new HumanMessage(caseContent)
  ];
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
      } else if (toolCall.name === "execute_command") {
        toolResult = await executeCommandTool.invoke(toolCall);
      } else {
        console.log(`未知工具: ${toolCall.name}`);
        continue;
      }

      // 必须将工具的结果放入 message 中，模型才能看到刚才发生了什么
      message.push(toolResult);
      console.log("工具执行结果:", toolResult.content);
    }
  }
}

main(case1);

