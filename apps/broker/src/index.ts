import express, { Request, Response } from "express";
import { prisma, MatchStatus } from "@repo/db";
import cors from "cors";
const app = express();
const port = 3000;

interface WsSubscribedTopic {
  [key: string]: string[];
}
const wsSubscribedTopics: WsSubscribedTopic = {};
var whitelist = ["http://localhost:5173", "http://localhost:5174"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (whitelist.indexOf(origin as string) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);
app.use(express.json());

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

app.post("/subscribe", (req, res) => {
  const topic = req.body.topic;
  if (typeof topic === "string") {
    if (wsSubscribedTopics[topic]?.includes(req.ip as string)) {
      res.status(400).json({ error: "Already subscribed" });
      return;
    } else if (wsSubscribedTopics[topic]) {
      wsSubscribedTopics[topic].push(req.ip as string);
    }
    res.status(200).json({ message: `Subscribed to ${topic}` });
  } else {
    res.status(400).json({ error: "Invalid topic" });
  }
});

app.listen(port, () => {
  console.log(`Broker running on ws://localhost:${port}`);
});
