/*
 * @Author: jiangxin
 * @Date: 2026-07-17 15:11:42
 * @Company: orientsec.com.cn
 * @Description:
 */
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { writeFile } from "fs/promises";
import { fileURLToPath } from "url";
import path from "path";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { PromptTemplate } from "@langchain/core/prompts";
import {
  RunnablePassthrough,
  RunnableSequence
} from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { marked } from "marked";
import { markedTerminal } from "marked-terminal";

const __filename = fileURLToPath(import.meta.url);

const type = process.env.type || "Z";
const company = !!type ? `${type}_` : "";
const modelInstance = new ChatOpenAI({
  model: process.env[`${company}MODE_NAME`],
  apiKey: process.env[`${company}API_KEY`],
  temperature: 0,
  configuration: {
    baseURL: process.env[`${company}BASE_URL`]
  }
});

const embeddingsInstance = new OpenAIEmbeddings({
  model: process.env[`${company}VECTOR_MODEL_NAME`],
  apiKey: process.env[`${company}API_KEY`],
  configuration: {
    baseURL: process.env[`${company}BASE_URL`]
  },
  encodingFormat: "float"
});

// 2. 新增：配置 marked 使用终端渲染器
marked.use(markedTerminal());

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 600, // 每个块的最大字符数
  chunkOverlap: 50 // 块与块之间的重叠字符数，保持上下文连贯
});

async function run() {
  try {
    const web_loader = new CheerioWebBaseLoader(
      "http://www.cppcc.gov.cn/zxww/2026/07/16/ARTI1784165686630164.shtml",
      {
        selector: "#page_body .column_wrapper .con"
      }
    );

    const docs = await web_loader.load();
    // console.log('path.resolve(__filename, "../")',path.resolve(__filename, "../../"))
    // writeFile(path.resolve(__filename, "../../")+"bbb.txt", docs.at(0)?.pageContent ?? "", {
    //   encoding: "utf-8"
    // });

    const splitDocs = await splitter.splitDocuments(docs);

    console.log("上下文被切成了:", splitDocs.length);

    const vectorStore = await MemoryVectorStore.fromDocuments(
      splitDocs,
      embeddingsInstance
    );

    const retriever = vectorStore?.asRetriever?.({ k: 3 });

    const prompt = PromptTemplate.fromTemplate(`
    你是一个可以根据上下方进行回答的助手，不要瞎回答，一下要根据上下文。

    <上下文>:
    {context}

    用户问题:
    {question}
      `);

    // 一个小工具函数：把检索到的多个 Document 对象，拼接成纯文本字符串
    const formatDocs = (retrievedDocs: Document[]) => {
      //@ts-ignore
      return retrievedDocs.map((doc) => doc.pageContent).join("\n\n");
    };

    const ragChain = RunnableSequence.from([
      {
        // 1. 将用户输入传递给 retriever，查出相关的文档，再用 formatDocs 变成字符串
        //@ts-ignore
        context: retriever.pipe(formatDocs),
        // 2. 将用户输入原封不动地传递给 question 变量
        question: new RunnablePassthrough()
      },
      // 3. 把拼装好的 {context, question} 传给 Prompt
      prompt,
      // 4. 把 Prompt 生成的完整提示词传给大模型
      modelInstance,
      // 5. 提取大模型返回结果中的文本部分
      new StringOutputParser()
    ]);

    const result = await ragChain.invoke("7月 15 日有什么新闻，总结一下");
    console.log(marked.parse(result));
  } catch (error) {
    console.error("error");
    console.error(error.message);
  }
}

run();

