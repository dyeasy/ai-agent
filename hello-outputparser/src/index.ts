import readline from "readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { ChatOpenAI } from "@langchain/openai";
import {
  JsonOutputParser,
  StructuredOutputParser
} from "@langchain/core/output_parsers";
import { HumanMessage } from "@langchain/core/messages";

import {
  ChatPromptTemplate,
  PromptTemplate,
  SystemMessagePromptTemplate
} from "@langchain/core/prompts";
import { context } from "@langchain/core/utils/context";
import z from "zod";

const readInstance = readline.createInterface({
  input,
  output
});

const modelInstance = new ChatOpenAI(process.env.MODE_NAME!, {
  apiKey: process.env.API_KEY,
  temperature: 0,
  configuration: {
    baseURL: process.env.BASE_URL
  }
});

async function jsonParser() {
  try {
    const jsonparser = new JsonOutputParser();

    const message = SystemMessagePromptTemplate.fromTemplate("{text}");

    const chatPrompt = ChatPromptTemplate.fromMessages([
      ["ai", "你是一个小助手"],
      message
    ]);
    const question =
      "介绍一下爱因斯坦的信息(中文数据)，以 json 格式返回，name(姓名)，brith(出生日期)，nationality(国籍)，achievements(主要成就，数组)，books（书籍，数组，3 本就可以了）";

    const prompt = await chatPrompt.invoke({
      text: question
    });

    console.log("开始调用大模型...");
    const result = await modelInstance.invoke(prompt);
    console.log(`收到响应[原始]\n`);
    console.log(result.content);
    console.log("==============================");
    const content_json = await jsonparser.parse(result.content as string);
    console.dir(content_json);
  } catch (error) {
    console.log((error as Error).message);
  }
}

async function jsonParser2() {
  const chatPrompt = ChatPromptTemplate.fromMessages([
    ["ai", "一是一个小助手 格式要求:{context}"],
    ["user", "{text}"]
  ]);

  const outputParser = StructuredOutputParser.fromNamesAndDescriptions({
    name: "姓名",
    brith: "出生日期",
    nationality: "国籍",
    achievements: "主要成就，数组",
    books: "书籍，返回3本就可以了，数组"
  });

  const chain = chatPrompt.pipe(modelInstance).pipe(outputParser);

  console.log("开始调用大模型流水线...");

  const content_json = await chain.invoke({
    context: outputParser.getFormatInstructions(),
    text: "介绍一下爱因斯坦的信息(中文数据)"
  });

  console.log("==============================");
  console.dir(content_json); // 这里
}

async function jsonParser3() {
  const chatPrompt = ChatPromptTemplate.fromMessages([
    ["ai", "一是一个小助手 格式要求:{context}"],
    ["user", "{text}"]
  ]);

  const structured = z.object({
    name: z.string().describe("姓名"),
    brith: z
      .string()
      .describe("出生日期，请严格使用 YYYY-MM-DD 格式，例如 1879-03-14"),
    nationality: z.string().describe("国籍"),
    achievements: z.array(z.string()).length(3).describe("成就"),
    books: z
      .array(
        z.object({
          title: z.string().describe("书名")
        })
      )
      .length(6)
  });

  const outputParser = StructuredOutputParser.fromZodSchema(structured);

  const chain = chatPrompt.pipe(modelInstance).pipe(outputParser);

  console.log("开始调用大模型流水线...");

  const content_json = await chain.invoke({
    context: outputParser.getFormatInstructions(),
    text: "介绍一下爱因斯坦的信息(中文数据)"
  });

  console.log("==============================");
  console.dir(content_json); // 这里
}

async function jsonParser4() {
  const structuredSchema = z.object({
    name: z.string().describe("姓名"),
    birth: z.string().describe("出生日期，格式 YYYY-MM-DD"),
    nationality: z.string().describe("国籍"),
    achievements: z.array(z.string()).length(3).describe("成就"),
    books: z.array(z.object({ title: z.string().describe("书名") })).max(6)
  });

  const chatPrompt = ChatPromptTemplate.fromMessages([
    ["system", "你是一个信息提取助手。"],
    ["user", "{text}"]
  ]);

  // 2. 【核心】直接让模型绑定结构化输出能力
  // 现代大模型（如 GPT-4o, Claude 3.5, DeepSeek-V3 等）原生支持此功能
  const structuredModel = modelInstance.withStructuredOutput(structuredSchema);

  //   // 3. 组装流水线 (Prompt -> 具有结构化输出能力的模型)
  const chain = chatPrompt.pipe(structuredModel);

  console.log("调用大模型...");

  // 4. 直接调用！返回值直接就是类型安全的 JS 对象，不需要任何 Parser
  const result = await chain.invoke({
    text: "介绍一下爱因斯坦的信息(中文数据)"
  });

  console.log("==============================");
  console.log(result.name); // TS 自动识别类型为 string
  console.log(result.achievements); // TS 自动识别类型为 string[]
  console.dir(result);
}

async function main() {
  jsonParser4();
}

main();

