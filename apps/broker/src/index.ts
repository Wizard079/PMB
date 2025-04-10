import express from "express";
import { prisma } from "@repo/db";

const app = express();
const port = 3000;
const cors = require("cors");

app.use(express.json());
app.use(cors());
interface WsSubscribedTopic {
  [key: string]: string[];
}
const wsSubscribedTopics: WsSubscribedTopic = {};

async function getMessagesFromDatabase(
  topic: string,
  limit: number
): Promise<{ id: number; topic: string; messageContent: string }[]> {
  return await prisma.message.findMany({
    where: { topic },
    ...(limit > 0 ? { take: limit } : {}),
  });
}
function sendToWs(topic: string, messageContent: string, method: string) {
  console.log("Sending data to websokcet : ");
  fetch("http://localhost:3001/publisher", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, messageContent, method }),
  }).catch(console.error);
}

async function saveMessageToDatabase(
  topic: string,
  messageContent: string
): Promise<void> {
  try {
    const message = await prisma.message.create({
      data: {
        topic,
        messageContent,
      },
    });
    console.log(`Message stored with ID ${message.id}`);
  } catch (err) {
    console.error("Error saving message:", err);
  }
}

app.get("/matches", async (req, res) => {
  const matches = await prisma.matches.findMany();
  res.json(matches);
});

app.post("/subscribe", async (req, res) => {
  const topic = req.body.topic;
  const limit = 6; // can change this latter now just hardcoding it for now
  if (typeof topic === "string") {
    if (wsSubscribedTopics[topic]?.includes(req.ip as string)) {
      res.status(400).json({ error: "Already subscribed" });
      return;
    } else if (wsSubscribedTopics[topic]) {
      wsSubscribedTopics[topic].push(req.ip as string);
    }
    const messages = await getMessagesFromDatabase(topic, limit);
    console.log("Current message : ", messages);
    res.status(200).json({ messages });
  } else {
    res.status(400).json({ error: "Invalid topic" });
  }
});

app.get("/unsubscribe", (req, res) => {
  Object.keys(wsSubscribedTopics).forEach((topic) => {
    if (Array.isArray(wsSubscribedTopics[topic])) {
      wsSubscribedTopics[topic] = wsSubscribedTopics[topic].filter(
        (ip) => ip !== req.ip
      );
    } else {
      console.log(`No subscribers for topic: ${topic}`);
    }
  });
  console.log("Unsubscribe done ");
  res.status(200).json({ msg: "Unsubscribe done" });
});

app.post("/publish", (req, res) => {
  console.log(req.body);
  const { topic, messageContent } = req.body;
  const method = req.body.method || "max_once";
  // console.log("log : the method is  ", method);
  // console.log("log : the topic is  ", topic);
  try {
    if (method === "at_least_once") {
      saveMessageToDatabase(topic, messageContent);
    }
    sendToWs(topic, messageContent, method);
  } catch (e) {
    console.error("there is an error ", e);
  }
  res.status(200).json({ message: "something is cooking" });
});

app.listen(port, () => {
  console.log(`Broker running on ws://localhost:${port}`);
});
