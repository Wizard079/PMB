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
      const match = await prisma.matches.create({
        data: {
          wickets1: 0,
          wickets2: 0,
          balls1: 0,
          balls2: 0,
          runs1: 0,
          runs2: 0,
          team1,
          team2,
          status: MatchStatus.NOT_STARTED,
        },
      });
      return res.status(200).json({ message: "Match created", match });
    }
  }
  return res.status(400).json({ error: "Invalid match data" });
});

app.get("/match", async (req, res) => {
  const matches = await prisma.matches.findMany();
  res.status(200).json(matches);
});

app.put("/match/:matchId", async (req, res) => {
  res
    .status(200)
    .json({ message: "Match updated", matchId: req.params.matchId });
});

app.post("/subscribe", async (req, res) => {
  const topic = req.body.topic;
  const limit = 6; // can change this latter now just hardcoding it for now
  if (typeof topic === "string") {
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
    console.log("log the req.ip is : ", req.ip, req.url, wsSubscribedTopics);
    res.status(200).json({ messages });
  } else {
    res.status(400).json({ error: "Invalid topic" });
  }
});

app.get("/unsubscribe", (req, res) => {
  if (Object.keys(wsSubscribedTopics).length === 0) {
    res
      .status(400)
      .json({ msg: "No active subscriptions to unsubscribe from." });
    return;
  }
  Object.keys(wsSubscribedTopics).forEach((topic) => {
    if (Array.isArray(wsSubscribedTopics[topic])) {
      wsSubscribedTopics[topic] = wsSubscribedTopics[topic].filter(
        (ip) => ip !== req.ip
      );
    } else {
      console.log(`log : No subscribers for topic: ${topic}`);
    }
  });
  res.status(200).json({ msg: "Unsubscribe done" });
});

app.post("/publish", async (req, res) => {
  console.log(req.body);
  const { id, status } = req.body;
  let method;
  let messageContent;
  if (status === "NOT_STARTED") {
    console.log("Match started")
    await prisma.matches.update({
      where: { id: Number(id) },
      data: { status: MatchStatus.IN_PROGRESS },
    });
    method = "at_least_once";
    messageContent = {
      status: MatchStatus.NOT_STARTED,
    };
  } else if (status === "COMPLETED") {
    await prisma.matches.update({
      where: { id: Number(id) },
      data: { status: MatchStatus.COMPLETED },
    });
    method = "at_least_once";
    messageContent = {
      status: MatchStatus.COMPLETED
    };
  }else{
    method = "max_once";
    const ball = req.body.type;
    if( ball === "6" || "4" || "W"){
      method = "at_least_once"
    }

    messageContent = {
      ...req.body,
    };

    const data = req.body
    delete data.type
    delete data.id

    console.log(data)
    await prisma.matches.update({
      where:{
        id: Number(id)
      },
      data
    })
    
  }
  messageContent = JSON.stringify(messageContent)
  try {
    if (method === "at_least_once") {
      saveMessageToDatabase(String(id), messageContent);
    }
    sendToWs(String(id), messageContent, method);
  } catch (e) {
    console.error("there is an error ", e);
  }
  res.status(200).json({ message: "something is cooking" });
});

app.listen(port, () => {
  console.log(`Broker running on http://localhost:${port}`);
});
