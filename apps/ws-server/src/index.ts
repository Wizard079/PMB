import http from "http";
import express from 'express';
import WebSocket, { WebSocketServer } from "ws";

const app = express()
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const port = 3001;

app.use(express.json())

interface SubscriberArray {
    [key: string]: WebSocket[];
}

const topicSubscribers : SubscriberArray  = {};

function subscribeToBroker(topic: string) {
    // logic to subscribe to pub/sub
}

wss.on("connection", (ws: WebSocket) => {
    ws.on("message", (msg) => {
        try {
            const json = JSON.parse(msg.toString());
            const topic = json.topic;
            try {
                if(typeof topic !== "string") throw new Error("topic is not a string")
                if(topicSubscribers[topic] && !(topicSubscribers[topic].includes(ws))){
                    topicSubscribers[topic].push(ws)
                }else if(!topicSubscribers[topic]){
                    subscribeToBroker(topic)
                    topicSubscribers[topic] = [ws]
                }

                console.log(topicSubscribers[topic].length)
            } catch (e) {
                console.error("there is an error ", e);
            }
        } catch (err) {
            console.error("Invalid JSON received:", err);
        }
    });
    ws.on("close", () => {
        console.log("client disconnected");
    })
})

function atMaxOnce(topic: string, messageContent: string) {
    if (topicSubscribers[topic]) {
        topicSubscribers[topic].forEach((subscriber) => {
            subscriber.send(
                JSON.stringify({ topic, messageContent: messageContent })
            );
        });
    }
}
function atLeastOnce(topic: string, messageContent: string) {
    if (topicSubscribers[topic]) {
        topicSubscribers[topic].forEach((subscriber) => {
            subscriber.send(
                JSON.stringify({ topic, messageContent: messageContent })
            );
        }
        );
    }
}

app.post("/publisher", (req,res)=>{
    const { topic, messageContent } = req.body;
    const method = req.body.method || "max_once";
    console.log("log : the method is  ", method);
    console.log("log : the topic is  ", topic);
    try {
        if(typeof topic !== "string") throw new Error("topic is not a string")
        if(method === "max_once"){
            atMaxOnce(topic, messageContent)
        }else if(method === "at_least_once"){
            atLeastOnce(topic, messageContent)
        }else throw new Error("method is not supported")
    } catch (e) {   
        console.error("there is an error ", e);
    }
    res.status(200).json({message : "ok"})
})

server.listen(port, () => {
  console.log(`Ws-server running on ws://localhost:${port}`);
});
