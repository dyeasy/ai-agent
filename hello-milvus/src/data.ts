/*
 * @Author: jiangxin
 * @Date: 2026-07-24 16:41:25
 * @Company: orientsec.com.cn
 * @Description:
 */
import { MilvusClient } from "@zilliz/milvus2-sdk-node";
import { OpenAIEmbeddings } from "@langchain/openai";

const milvusclient = new MilvusClient({
  address: "127.0.0.1:19530"
});

const VECTOR_DIM = 1024;

const embeddingsMode = new OpenAIEmbeddings({
  apiKey: process.env.API_KEY,
  model: process.env.VECTOR_MODEL_NAME,
  configuration: {
    baseURL: process.env.BASE_URL
  },
  dimensions: VECTOR_DIM
});

async function getEmbedding(text: string) {
  const result = await embeddingsMode.embedQuery(text);
  return result;
}

async function main() {
  try {
    console.log("Connecting to Milvus...");
    await milvusclient.connectPromise;
    console.log("✓ Connected\n");

    const diaryContents = [
      {
        id: "diary_001",
        content:
          "今天天气很好，去公园散步了，心情愉快。看到了很多花开了，春天真美好。",
        date: "2026-01-10",
        mood: "happy",
        tags: ["生活", "散步"]
      },
      {
        id: "diary_002",
        content:
          "今天工作很忙，完成了一个重要的项目里程碑。团队合作很愉快，感觉很有成就感。",
        date: "2026-01-11",
        mood: "excited",
        tags: ["工作", "成就"]
      },
      {
        id: "diary_003",
        content:
          "周末和朋友去爬山，天气很好，心情也很放松。享受大自然的感觉真好。",
        date: "2026-01-12",
        mood: "relaxed",
        tags: ["户外", "朋友"]
      },
      {
        id: "diary_004",
        content:
          "今天学习了 Milvus 向量数据库，感觉很有意思。向量搜索技术真的很强大。",
        date: "2026-01-12",
        mood: "curious",
        tags: ["学习", "技术"]
      },
      {
        id: "diary_005",
        content:
          "晚上做了一顿丰盛的晚餐，尝试了新菜谱。家人都说很好吃，很有成就感。",
        date: "2026-01-13",
        mood: "proud",
        tags: ["美食", "家庭"]
      }
    ];

    const data = await Promise.all(
      diaryContents.map(async (data) => {
        return {
          ...data,
          vector: await getEmbedding(data.content)
        };
      })
    );
    console.log("✓ Successfully generated data:");
    const result = await milvusclient.insert({
      collection_name: "my_collection",
      data
    });
    console.log(`数据插入成功：${result.insert_cnt}`);
  } catch (error) {
    console.error(error.message);
  }
}

main();

