import fs from "fs/promises";
import path from "path";
import { MarkdownTextSplitter } from "@langchain/textsplitters";
import fg from "fast-glob";
import { OpenAIEmbeddings } from "@langchain/openai";
import type { Document } from "@langchain/core/documents";
import { MilvusClient } from "@zilliz/milvus2-sdk-node";
import { chunk } from "es-toolkit";

const collection_name = "fastman_docs";

const milvusClient = new MilvusClient({
  address: "127.0.0.1:19530"
});
const embeddingsModel = new OpenAIEmbeddings({
  apiKey: process.env.API_KEY!,
  model: process.env.VECTOR_MODEL_NAME!,
  configuration: {
    baseURL: process.env.BASE_URL
  },
  dimensions: 1024,
  batchSize: 10
});

async function insertData(data: Document[]) {
  try {
    const texts = data.map((d) => d.pageContent);
    const vectors = await embeddingsModel.embedDocuments(texts);

    // 组装要插入 Milvus 的数据
    const milvusData = data.map((d, index) => ({
      title: d.metadata.title || "未命名文档",
      content: d.pageContent || "内容缺失",
      vector: vectors[index]
    }));

    const batches = chunk(milvusData, 50);

    let totalInserted = 0;

    console.log("💾 开始向 Milvus 插入数据...");
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      if (!batch?.length) continue;

      const record = await milvusClient.insert({
        collection_name,
        data: batch
      });
      totalInserted += Number.parseInt(record.insert_cnt);
      console.log(
        `   ➡️ 批次 ${i + 1}/${batches.length} 插入成功 (${batch.length} 条)`
      );
    }

    console.log(`✅ 所有数据插入完毕！共插入 ${totalInserted} 条数据。`);

    // 插入完毕后加载 Collection 以供检索
    console.log("🔄 正在加载 Collection 到内存...");
    await milvusClient.loadCollection({
      collection_name: collection_name
    });
    console.log("🚀 Collection 已就绪，可以开始搜索！");
  } catch (error) {
    console.error(`出错了:${(error as Error).message}`);
    throw error;
  } finally {
    // 【修改4】脚本执行完毕后，一定要释放 Milvus 连接，否则进程挂起无法退出
    await milvusClient.closeConnection();
  }
}

async function main() {
  try {
    const paths = await fg.stream("**/*.md", {
      absolute: true,
      cwd: "/Users/jiangxin/dfzq/fastman3-docs/docs"
    });

    const splitter = new MarkdownTextSplitter({
      chunkSize: 500,
      chunkOverlap: 150
    });
    const allDocuments: Document[] = [];
    for await (const entry of paths) {
      // entry 是流吐出的文件路径 (string)
      const filePath = entry.toString();

      try {
        // 1. 等待读取文件内容 (必须用 fs/promises 里的 readFile)
        const textContent = await fs.readFile(filePath, { encoding: "utf-8" });

        if (!textContent.length) continue;

        const titleMatch = textContent.match(/^#\s+(.*)$/m);

        // 2. 健壮性处理：如果文件里真没写 "# 标题"，就用文件名作为兜底
        const docTitle = titleMatch
          ? titleMatch?.[1]?.trim?.()
          : path.basename(filePath, ".md");

        // 2. 将文本切块，并顺手把文件路径作为 metadata 注入
        // createDocuments 接收两个数组：[文本内容], [对应的 metadata]
        const docs = await splitter.createDocuments(
          [textContent],
          [{ title: docTitle, source_file: filePath }]
        );

        // 3. 将切好的 Chunk 追加到总数组中
        allDocuments.push(...docs);
      } catch (readError) {
        // 捕获单个文件的读取错误，防止一个坏文件搞崩整个流
        console.warn(`⚠️ 跳过文件 ${filePath}，读取或切分失败:`, readError);
      }
    }

    const hasCollection = await milvusClient.hasCollection({
      collection_name: collection_name
    });

    if (hasCollection.value) {
      insertData(allDocuments);
    }
  } catch (error) {
    console.error(`出错了:${(error as Error).message}`);
    throw error;
  }
}

main();

