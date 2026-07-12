/*
 * @Author: jiangxin
 * @Date: 2026-07-12 14:44:46
 * @Company: orientsec.com.cn
 * @Description:
 */
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
const modelInstance=new ChatOpenAI({
    model:"glm-4.7",
    // configuration:{
    //     baseURL:"",
    // }
})