/*
 * @Author: jiangxin
 * @Date: 2026-07-12 14:44:46
 * @Company: orientsec.com.cn
 * @Description:
 */
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { PromptTemplate } from "@langchain/core/prompts";
import {
  RunnablePassthrough,
  RunnableSequence
} from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const type = process.env.type || "Z";
const company = !!type ? `${type}_` : "";

console.log("companycompany", company);

// 默认:阿里云百炼
// Z:智谱
// TXY: 腾讯云

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
  encodingFormat: "float",
});

console.log("vvv", embeddingsInstance.model);

const docs = [
  new Document({
    pageContent: `光光是一个活泼开朗的小男孩，他有一双明亮的大眼睛，总是带着灿烂的笑容。光光最喜欢的事情就是和朋友们一起玩耍，他特别擅长踢足球，每次在球场上奔跑时，就像一道阳光一样充满活力。`,
    metadata: {
      chapter: 1,
      character: "光光",
      type: "角色介绍",
      mood: "活泼"
    }
  }),
  new Document({
    pageContent: `东东是光光最好的朋友，他是一个安静而聪明的男孩。东东喜欢读书和画画，他的画总是充满了想象力。虽然性格不同，但东东和光光从幼儿园就认识了，他们一起度过了无数个快乐的时光。`,
    metadata: {
      chapter: 2,
      character: "东东",
      type: "角色介绍",
      mood: "温馨"
    }
  }),
  new Document({
    pageContent: `有一天，学校要举办一场足球比赛，光光非常兴奋，他邀请东东一起参加。但是东东从来没有踢过足球，他担心自己会拖累光光。光光看出了东东的担忧，他拍着东东的肩膀说："没关系，我们一起练习，我相信你一定能行的！"`,
    metadata: {
      chapter: 3,
      character: "光光和东东",
      type: "友情情节",
      mood: "鼓励"
    }
  }),
  new Document({
    pageContent: `接下来的日子里，光光每天放学后都会教东东踢足球。光光耐心地教东东如何控球、传球和射门，而东东虽然一开始总是踢不好，但他从不放弃。东东也用自己的方式回报光光，他画了一幅画送给光光，画上是两个小男孩在球场上一起踢球的场景。`,
    metadata: {
      chapter: 4,
      character: "光光和东东",
      type: "友情情节",
      mood: "互助"
    }
  }),
  new Document({
    pageContent: `比赛那天终于到了，光光和东东一起站在球场上。虽然东东的技术还不够熟练，但他非常努力，而且他用自己的观察力帮助光光找到了对手的弱点。在关键时刻，东东传出了一个漂亮的球，光光接球后射门得分！他们赢得了比赛，更重要的是，他们的友谊变得更加深厚了。`,
    metadata: {
      chapter: 5,
      character: "光光和东东",
      type: "高潮转折",
      mood: "激动"
    }
  }),
  new Document({
    pageContent: `从那以后，光光和东东成为了学校里最要好的朋友。光光教东东运动，东东教光光画画，他们互相学习，共同成长。每当有人问起他们的友谊，他们总是笑着说："真正的朋友就是互相帮助，一起变得更好的人！"`,
    metadata: {
      chapter: 6,
      character: "光光和东东",
      type: "结局",
      mood: "欢乐"
    }
  }),
  new Document({
    pageContent: `多年后，光光成为了一名职业足球运动员，而东东成为了一名优秀的插画师。虽然他们走上了不同的道路，但他们的友谊从未改变。东东为光光设计了球衣上的图案，光光在每场比赛后都会给东东打电话分享喜悦。他们证明了，真正的友情可以跨越时间和距离，永远闪闪发光。`,
    metadata: {
      chapter: 7,
      character: "光光和东东",
      type: "尾声",
      mood: "温馨"
    }
  })
];

console.log("⏳ 正在将文档向量化并存入内存...");
const vectorStore = await MemoryVectorStore.fromDocuments(
  docs,
  embeddingsInstance
);
console.log("✅ 存储完毕！\n");

const retriever = vectorStore.asRetriever({ k: 7 });

const prompt = PromptTemplate.fromTemplate(`
请你扮演一个专业的助手。请严格根据以下提供的<上下文>信息来回答用户的问题。
如果你在<上下文>中找不到答案，请直接说“我不知道”，千万不要自己编造。

<上下文>:
{context}

用户问题:
{question}
  `);

// 一个小工具函数：把检索到的多个 Document 对象，拼接成纯文本字符串
const formatDocs = (retrievedDocs: Document[]) => {
  return retrievedDocs.map((doc) => doc.pageContent).join("\n\n");
};

// ==========================================
// 第三步：组装 LCEL 链并生成 (Generation)
// ==========================================
const ragChain = RunnableSequence.from([
  {
    // 1. 将用户输入传递给 retriever，查出相关的文档，再用 formatDocs 变成字符串
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

const content = await ragChain.invoke("东东和光光是怎么成为朋友的？");
console.log(`🤖 回答: ${content}\n`);

// const r = await modelInstance.invoke([
//   new SystemMessage("你好啊请介绍一下自己"),
//   new HumanMessage("你好啊请介绍一下自己")
// ]);

// console.log(`🤖 回答: ${r.content}\n`);

