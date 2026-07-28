/*
 * @Author: jiangxin
 * @Date: 2026-07-28 13:58:13
 * @Company: orientsec.com.cn
 * @Description:
 */

import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnablePassthrough, RunnableSequence } from "@langchain/core/runnables";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
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
  temperature: 0.7
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

const rag = async (queryVector: number[]) => {
  return await milvusClient.search({
    collection_name: "fastman_docs",
    data: [queryVector],
    limit: 5
  });
};

const prompt = PromptTemplate.fromTemplate(`
        请你扮演一个fastman web 前端框架相关专业的助手。请严格根据以下提供的<上下文>信息来回答用户的问题。
        如果你在<上下文>中找不到答案，请直接说“我不知道”，千万不要自己编造。

        <上下文>:
        {context}

        用户问题:
        {question}
`);

async function main() {
  try {
    const question = await rl.question(">");
    const queryVector = await getEmbedding(question);
    const queryResult = await rag(queryVector);

    const context = queryResult.results
      .map((diary, i) => {
        return `[标题${i + 1}]
                内容: ${diary.content}`;
      })
      .join("\n\n━━━━━\n\n");

    const ragChain = RunnableSequence.from([
      {
        // 1. 将用户输入传递给 retriever，查出相关的文档，再用 formatDocs 变成字符串
        context: () => context,
        // 2. 将用户输入原封不动地传递给 question 变量
        question: new RunnablePassthrough()
      },
      // 3. 把拼装好的 {context, question} 传给 Prompt
      prompt,
    //   (promptValue) => {
    //     console.log("\n====== 最终发送给大模型的提示词 ======");
    //     // promptValue 是 LangChain 的内部对象，使用 toString() 可以转成纯文本
    //     console.log(promptValue.toString());
    //     console.log("=======================================\n");

    //     // 注意：必须原样返回，否则 model 收不到数据
    //     return promptValue;
    //   },
      // 4. 把 Prompt 生成的完整提示词传给大模型
      model,
      // 5. 提取大模型返回结果中的文本部分
      new StringOutputParser()
    ]);

    console.log("\n【AI 回答】");
    const messages = await ragChain.stream(question);
    console.log('开始输出')
    for await (const chunk of messages) {
      process.stdout.write(chunk);
    }
  } catch (error) {
    console.log((error as Error).message);
  }
}

main();