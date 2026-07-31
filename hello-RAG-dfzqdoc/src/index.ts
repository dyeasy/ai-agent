/*
 * @Author: jiangxin
 * @Date: 2026-07-28 13:58:13
 * @Company: orientsec.com.cn
 * @Description:
 */

import { Milvus } from "@langchain/community/vectorstores/milvus";
import { StringOutputParser } from "@langchain/core/output_parsers";
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  PromptTemplate,
  SystemMessagePromptTemplate
} from "@langchain/core/prompts";
import {
  RunnableLambda,
  RunnablePassthrough,
  RunnableSequence
} from "@langchain/core/runnables";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { log } from "console";
import { MilvusClient } from "@zilliz/milvus2-sdk-node";
import readline from "readline/promises";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const model = new ChatOpenAI({
  apiKey: process.env.API_KEY!,
  model: process.env.MODE_NAME!,
  configuration: {
    baseURL: process.env.BASE_URL
  },
  temperature: 0.3
});

const embeddingsModel = new OpenAIEmbeddings({
  apiKey: process.env.API_KEY!,
  model: process.env.VECTOR_MODEL_NAME!,
  configuration: {
    baseURL: process.env.BASE_URL
  },
  dimensions: 1024
});

const milvusClient = new MilvusClient({
  address: "127.0.0.1:19530"
});

const getEmbedding = async (text: string) => {
  return await embeddingsModel.embedQuery(text);
};

const search = async (queryVector: number[]) => {
  return await milvusClient.search({
    collection_name: "fastman_docs",
    data: [queryVector],
    limit: 10
  });
};

async function main() {
  try {
    const prompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(
        `请你是一个fastman web 前端框架相关专业的助手。
         请严格根据以下提供的<上下文>信息来回答用户的问题。
         如果你在<上下文>中找不到答案，请直接说“我不知道”，千万不要自己编造
         ${"=".repeat(20)}
         <上下文>:
        {context}
        `
      ),
      HumanMessagePromptTemplate.fromTemplate(`用户问题:{question}`)
    ]);

    const getEmbeddingRunnable = RunnableLambda.from(getEmbedding);
    const searchRunnable = RunnableLambda.from(search);

    const formatDocsRunnable = RunnableLambda.from(({ results }) => {
      //   console.log("aa", results);
      return results
        ?.map?.((diary, i) => {
          return `[标题${i + 1}]
                内容: ${diary.content}`;
        })
        .join("\n\n━━━━━\n\n");
    });

    const milvusRunnalbe = RunnableSequence.from([
      getEmbeddingRunnable,
      searchRunnable,
      formatDocsRunnable
    ]);
    const chat = RunnableSequence.from([
      {
        context: milvusRunnalbe,
        question: () => new RunnablePassthrough()
      },
      prompt,
      model,
      new StringOutputParser()
    ]);

    const res = await chat.stream("h5 的页面或路由跳转怎么弄");
    for await (const chunk of res) {
        process.stdout.write(chunk)
    }
  } catch (error) {
    console.log((error as Error).message);
  }
}

main();

