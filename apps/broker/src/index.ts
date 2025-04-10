import express, { Request, Response } from "express";
import { prisma, MatchStatus } from "@repo/db";
import cors from "cors";

const app = express();
const port = 3000;
var whitelist = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3001",
];

interface WsSubscribedTopic {
  [key: string]: string[];
}

const wsSubscribedTopics: WsSubscribedTopic = {};

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || whitelist.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS`));
      }
    },
  })
);
app.use(express.json());

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
  console.log("Sending data to websokcet");
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
//@ts-ignore
app.post("/match", async (req: Request, res: Response) => {
  const team1 = req.body.team1;
  const team2 = req.body.team2;
  if (
    team1 &&
    team2 &&
    typeof team1 === "string" &&
    typeof team2 === "string"
  ) {
    const existingMatch = await prisma.matches.findFirst({
      where: {
        OR: [
          { team1: team1, team2: team2 },
          { team1: team2, team2: team1 },
        ],
      },
    });

    if (!existingMatch) {
      await prisma.matches.create({
        data: {
          wickets: 0,
          balls: 0,
          runs: 0,
          team1,
          team2,
          status: MatchStatus.NOT_STARTED,
        },
      });
      return res.status(200).json({ message: "Match created" });
    }
  }
  return res.status(400).json({ error: "Invalid match data" });
});

app.get("/matches", async (req, res) => {
  const matches = await prisma.matches.findMany();
  res.json(matches);
});

app.post("/subscribe", async (req, res) => {
  const topic = req.body.topic;
  const limit = 6; // can change this latter now just hardcoding it for now
  if (typeof topic === "string") {
    // console.log("log the req.ip is : ", req.ip, wsSubscribedTopics[topic]);
    if (wsSubscribedTopics[topic]?.includes(req.ip as string)) {
      res.status(400).json({ error: "Already subscribed" });
      return;
    }

    if (!wsSubscribedTopics[topic]) {
      wsSubscribedTopics[topic] = [];
    }
    wsSubscribedTopics[topic].push(req.ip as string);
    const messages = await getMessagesFromDatabase(topic, limit);
    // console.log("Current message : ", messages);
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
  console.log(`Broker running on http://localhost:${port}`);
});
