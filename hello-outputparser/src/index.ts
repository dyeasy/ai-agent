import readline from "readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { ChatOpenAI } from "@langchain/openai";
import {
  JsonOutputParser,
  StringOutputParser,
  StructuredOutputParser
} from "@langchain/core/output_parsers";
import { HumanMessage } from "@langchain/core/messages";

import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  PromptTemplate,
  SystemMessagePromptTemplate
} from "@langchain/core/prompts";
import { context } from "@langchain/core/utils/context";
import z from "zod";
import { JsonOutputToolsParser } from "@langchain/core/output_parsers/openai_tools";

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
    books: z
      .array(
        z.object({ title: z.string().describe("他写的书有哪些比较著名的") })
      )
      .max(6)
  });

  const humanMessage = HumanMessagePromptTemplate.fromTemplate(`{text}`);

  const chatPrompt = ChatPromptTemplate.fromMessages([
    ["system", "你是一个信息提取助手。{date}"],
    humanMessage
  ]);

  // 2. 【核心】直接让模型绑定结构化输出能力
  // 现代大模型（如 GPT-4o, Claude 3.5, DeepSeek-V3 等）原生支持此功能
  const structuredModel = modelInstance.withStructuredOutput(structuredSchema);

  //   //   // 3. 组装流水线 (Prompt -> 具有结构化输出能力的模型)
  const chain = chatPrompt.pipe(structuredModel);

  //   // 4. 直接调用！返回值直接就是类型安全的 JS 对象，不需要任何 Parser
  const result = await chain.invoke({
    date: Temporal.Now.plainDateISO().toLocaleString(),
    text: "介绍一下爱因斯坦的信息(中文数据)"
  });
  console.dir(result);
}

async function jsonParser5() {
  const structuredSchema = z.object({
    name: z.string().describe("收货人"),
    phoneNumber: z.number().describe("收货人手机号"),
    areaAddress: z
      .string()
      .describe("所在地区，这里是一个大的区域地址，不需要包含详细地址"),
    detailedAddress: z.string().describe("详情地址")
  });

  const humanMessage =
    HumanMessagePromptTemplate.fromTemplate(`需要提取的信息:{text}`);

  const chatPrompt = ChatPromptTemplate.fromMessages([
    ["system", "收货人信息提取助手。{date}"],
    humanMessage
  ]);

  // 2. 【核心】直接让模型绑定结构化输出能力
  // 现代大模型（如 GPT-4o, Claude 3.5, DeepSeek-V3 等）原生支持此功能
  const structuredModel = modelInstance.withStructuredOutput(structuredSchema);

  //   //   // 3. 组装流水线 (Prompt -> 具有结构化输出能力的模型)
  const chain = chatPrompt.pipe(structuredModel);

  //   // 4. 直接调用！返回值直接就是类型安全的 JS 对象，不需要任何 Parser
  const result = await chain.invoke({
    date: Temporal.Now.plainDateISO().toLocaleString(),
    text: "13535537651DYYYY湖南长沙市芙蓉区远大一路1149号辉煌国际城二期14栋406"
  });
  console.dir(result);
}

async function jsonParser6() {
  const structuredSchema = z.object({
    name: z.string().describe("收货人"),
    phoneNumber: z.number().describe("收货人手机号"),
    areaAddress: z
      .string()
      .describe("所在地区，这里是一个大的区域地址，不需要包含详细地址"),
    detailedAddress: z.string().describe("详情地址")
  });

  const parser = StructuredOutputParser.fromZodSchema(structuredSchema);

  const humanMessage =
    HumanMessagePromptTemplate.fromTemplate(`需要提取的信息:{text}`);

  const chatPrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `
        收货人信息提取助手。{date}
        /////////////////////////
        格式要求(严格遵守):
        {format}
      `
    ],
    humanMessage
  ]);

  const start = chatPrompt.pipe(modelInstance).pipe(new StringOutputParser());

  const result = await start.stream({
    format: parser.getFormatInstructions(),
    date: Temporal.Now.plainDateISO().toLocaleString(),
    text: "13535537651李哈哈湖南长沙市芙蓉区远大一路1149号辉煌国际城二期14栋898"
  });

  for await (const chunk of result) {
    process.stdout.write(chunk);
  }
}

async function jsonParser7() {
  const structuredSchema = z.object({
    name: z.string().describe("收货人"),
    phoneNumber: z.number().describe("收货人手机号"),
    areaAddress: z
      .string()
      .describe("所在地区，这里是一个大的区域地址，不需要包含详细地址"),
    detailedAddress: z.string().describe("详情地址")
  });
  const myModel = modelInstance.bindTools([
    {
      name: "format_consignee",
      description: "用来提取收货人数据并且进行格式化",
      schema: structuredSchema
    }
  ]);

  const humanMessage =
    HumanMessagePromptTemplate.fromTemplate(`需要提取的信息:{text}`);

  const chatPrompt = ChatPromptTemplate.fromMessages([
    ["system", `收货人信息提取助手。{date}`],
    humanMessage
  ]);

  //   const prompt = await chatPrompt.formatMessages({
  //     date: Temporal.Now.plainDateISO().toLocaleString("zh-cn"),
  //     text: "13535537651李哈哈湖南长沙市芙蓉区远大一路1149号辉煌国际城二期14栋898"
  //   });

  const parser = new JsonOutputToolsParser();

  console.log("开始调用大模型流水线");

  const model = chatPrompt.pipe(myModel).pipe(parser);

  const result = await model.stream(
    {
      date: Temporal.Now.plainDateISO().toLocaleString("zh-cn"),
      text: "13535537651李哈哈湖南长沙市芙蓉区远大一路1149号辉煌国际城二期14栋898"
    },
    {
      // 在这里加上 callbacks 参数拦截
      callbacks: [
        {
          handleChatModelStart(llm, messages, runId, parentRunId, extraParams) {
            console.log("\n====== 1. 最终发给大模型的文本提示词 ======");
            console.dir(messages, { depth: null });

            console.log("\n====== 2. 底层绑定的 Tools (Schema) ======");
            // 这里能看到你的 Zod Schema 被转换成了 JSON Schema 传给了大模型
            console.dir(extraParams?.invocation_params?.tools, { depth: null });

            console.log("\n===========================================\n");
          }
        }
      ]
    }
  );
  console.log("返回结果");
  for await (const chunk of result) {
    console.log(chunk);
  }
}

async function main() {
  jsonParser7();
}

main();

