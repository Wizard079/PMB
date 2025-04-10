import express from "express";
import db from "@repo/db/client"

const app = express();
const port = 3000;

interface WsSubscribedTopic {
	[key: string]: string[];
}
const wsSubscribedTopics: WsSubscribedTopic = {}

app.get("/matches", async (req, res) => {
	const matches = await db.matches.findMany();
	res.json(matches);
})

app.post("/subscribe", (req, res) => {
  const topic = req.body.topic;
  if (typeof topic === "string") {
	if(wsSubscribedTopics[topic]?.includes(req.ip as string)){
		res.status(400).json({ error: "Already subscribed" });
		return;
	}else if(wsSubscribedTopics[topic]){
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
