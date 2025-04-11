import http from "http";
import express from "express";
import WebSocket, { WebSocketServer } from "ws";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const port = 3001;
const cors = require("cors");

app.use(express.json());
app.use(cors());

interface SubscriberArray {
  [key: string]: WebSocket[];
}

const toSendMessage: SubscriberArray = {};
const topicSubscribers: SubscriberArray = {};

function subscribeToBroker(topic: string, ws: WebSocket) {
  fetch("http://localhost:3000/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic }),
  })
    .then((res) => res.json())
    .then((data) => {
      console.log(data);
      if (Array.isArray(data.messages)) {
        if (data.messages.length === 0) {
          console.log("No messages received. for ", topic);
          return;
        }
        data.messages.forEach((msg: any) => {
          ws.send(
            JSON.stringify({ topic, messageContent: msg.messageContent })
          );
        });
      }
    })
    .catch(console.error);
}

function unsubscribe() {
  fetch("http://localhost:3000/unsubscribe", {
    method: "GET",
  }).catch(console.error);
}

wss.on("connection", (ws: WebSocket) => {
  ws.on("message", (msg) => {
    try {
      const parseMsg = JSON.parse(msg.toString());
      const { topic, type } = parseMsg;

      if (type === "ACK") {
        if (Array.isArray(toSendMessage) && toSendMessage[topic].length !== 0) {
          toSendMessage[topic] = toSendMessage[topic].filter(
            (sub: WebSocket) => sub !== ws
          );
        }
      }
      try {
        if (typeof topic !== "string") throw new Error("topic is not a string");
        if (topicSubscribers[topic] && !topicSubscribers[topic].includes(ws)) {
          topicSubscribers[topic].push(ws);
        } else if (!topicSubscribers[topic]) {
          topicSubscribers[topic] = [ws];
          subscribeToBroker(topic, ws);
        }
      } catch (e) {
        console.error("there is an error ", e);
      }
    } catch (err) {
      console.error("Invalid JSON received:", err);
    }
  });
  ws.on("close", () => {
    Object.keys(topicSubscribers).forEach((topic) => {
      if (
        Array.isArray(topicSubscribers[topic]) &&
        topicSubscribers[topic].length !== 0
      ) {
        topicSubscribers[topic] = topicSubscribers[topic].filter(
          (sub) => sub !== ws
        );
      } else {
        console.log(`No subscribers for topic: ${topic}`);
      }
    });
    unsubscribe();
    console.log("client disconnected");
  });
});

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
      try {
        subscriber.send(
          JSON.stringify({
            topic,
            messageContent: messageContent,
            method: "at_least_once",
          })
        );
        if (!toSendMessage[topic]) {
          toSendMessage[topic] = [];
        }
        toSendMessage[topic].push(subscriber);
        console.log("ws-server/log : toSendMessage", toSendMessage);
      } catch (err) {
        console.error("Send failed:", err);
      }
    });
  }
}

app.post("/publisher", (req, res) => {
  const { topic, messageContent } = req.body;
  const method = req.body.method || "max_once";
  console.log("log : the method is  ", method);
  console.log("log : the topic is  ", topic);
  try {
    if (typeof topic !== "string") throw new Error("topic is not a string");
    if (method === "max_once") {
      atMaxOnce(topic, messageContent);
    } else if (method === "at_least_once") {
      atLeastOnce(topic, messageContent);
    } else throw new Error("method is not supported");
  } catch (e) {
    console.error("there is an error ", e);
  }
  res.status(200).json({ message: "ok" });
});

server.listen(port, () => {
  console.log(`Ws-server running on ws://localhost:${port}`);
});
