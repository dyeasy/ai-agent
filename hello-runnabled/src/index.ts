/*
 * @Author: jiangxin
 * @Date: 2026-07-30 15:10:42
 * @Company: orientsec.com.cn
 * @Description:
 */
import { PromptTemplate } from "@langchain/core/prompts";
import {
  RunnableBranch,
  RunnableEach,
  RunnableLambda,
  RunnableMap,
  RunnableParallel,
  RunnablePassthrough,
  RunnablePick,
  RunnableRetry,
  RunnableSequence
} from "@langchain/core/runnables";
import { log } from "console";
async function main_RunnableLambda() {
  const runn1 = RunnableLambda.from(function (input: number) {
    console.log("runn1", input);
    return input + 1;
  });

  const runn2 = RunnableLambda.from(function (input: number) {
    console.log("runn2", input);
    return input * 2;
  });

  const start = RunnableSequence.from([runn1, runn2, runn1]);

  const result = await start.invoke(10);
  log(result);
}

async function main_RunnableMap() {
  const start = RunnableMap.from({
    bbbb: (input) => {
      console.log("fdsafdsa", input);
      return 1000;
    },
    ffff: (input) => {
      console.log("ffff", input);
      return 10001;
    }
  });

  const result = await start.invoke({ old: "hellow" });
  log(result);
}

async function main_RunnableBranch() {
  // 有条件的执行方法，如果没有方法被执行，将执行默认的方法，也就是数组的最好一个元素
  const start = RunnableBranch.from([
    [
      (input) => input > 5,
      (input) => {
        log("aaaaaafdsfdsf", input);
        return { name: 3333 };
      }
    ],
    (input) => {
      console.log("aaaaa", input);
      return { name: 1111 };
    }
  ]);

  const result = await start.invoke(1);
  log(result);
}

async function main_RunnableEach() {
  // RunnableEach可以将输入的每一个元素都经过 pipe 进行操作
  const toUpperCase = (input: string): string => input.toUpperCase();
  const addGreeting = (input: string): string => `Hello, ${input}!`;

  const upperCaseLambda = RunnableLambda.from(toUpperCase);
  const greetingLambda = RunnableLambda.from(addGreeting);

  const chain = new RunnableEach({
    bound: upperCaseLambda.pipe(greetingLambda)
  });
  const result = await chain.invoke(["alice", "bob", "carol"]);
  log(result);
}

async function main_RunnableParallel() {
  const addYears = (age: number): number => age + 5;
  const yearsToFifty = (age: number): number => 50 - age;
  const yearsToHundred = (age: number): number => 100 - age;

  const addYearsLambda = RunnableLambda.from(addYears);
  const milestoneFiftyLambda = RunnableLambda.from(yearsToFifty);
  const milestoneHundredLambda = RunnableLambda.from(yearsToHundred);

  // Pipe will coerce objects into RunnableParallel by default, but we
  // explicitly instantiate one here to demonstrate
  const sequence = addYearsLambda.pipe(
    RunnableParallel.from({
      years_to_fifty: milestoneFiftyLambda,
      years_to_hundred: milestoneHundredLambda
    })
  );

  // Invoke the sequence with a single age input
  const res = await sequence.invoke(25);
  log(res);
}

async function main_RunnablePick() {
  const inputData = {
    name: "John",
    age: 30,
    city: "New York",
    country: "USA",
    email: "john.doe@example.com",
    phone: "+1234567890"
  };

  const basicInfoRunnable = new RunnablePick(["name", "city"]);

  // Example invocation
  const res = await basicInfoRunnable.invoke(inputData);

  log(res);
}

async function main_RunnablePassthrough() {
  const start = RunnableSequence.from([
    {
      question: new RunnablePassthrough(),
      age: async () => {
        await new Promise((r) => {
          setTimeout(r, 3000);
        });
        return 200;
      }
    },
    (input) => {
      console.log(input);
      return { name: 111 };
    }
  ]);

  const res = await start.invoke("ddddd");
  log(res);
}

async function withRetry() {
  const simulateApiCall = (input: string): string => {
    console.count();
    console.log(`Attempting API call with input: ${input}`);

    const num = Math.round(Math.random());
    console.log("num", num);
    if (num === 0) {
      throw new Error("API call failed due to network issue");
    }

    return "dfdfdfdfdfd";
  };

  const apiCallLambda = RunnableLambda.from(simulateApiCall);

  // 方法一
  //   const apiCallWithRetry = apiCallLambda.withRetry({ stopAfterAttempt: 3 });

  //   const res = await apiCallWithRetry.invoke("fdsafdsafdsa");
  //   log(res);

  // 方法二
  const manualRetry = new RunnableRetry({
    bound: apiCallLambda,
    maxAttemptNumber: 5,

    config: {}
  });

  const res = await manualRetry.invoke("哈哈哈");
  log(res);
}

// main_RunnableLambda();

// main_RunnableMap();

// main_RunnableBranch();

// main_RunnableEach();

// main_RunnableParallel();

// main_RunnablePick();

// main_RunnablePassthrough();

withRetry();

