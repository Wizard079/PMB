const http = require('http')
const WebSocket = require('ws')


const server = http.createServer()
const wss = new WebSocket.Server( { server }); 
const { saveMessageToDatabase, getMessagesFromDatabase } = require('./db');  // Import functions from db.js


const topicSubscribers = {}
wss.on('connection' , (ws) => {
  ws.on('message', (msg) => {
    console.log("got new msg : ", msg);
      /*
        handing the publisher and subscriber request expected is 
        type msg = {
          type: 'pub' | 'sub';  // 'pub' or 'sub' values for type
          topic: string;        // topic name (required)
          limit?: number;       // optional limit (integer) default is 3
          method?: 'at_least_once' | 'max_once'; // required for publisher only default is 'max_once'
          messageContent: string;     // required for publisher only
        };
      */
      try{
        const parsedMessage = JSON.parse(msg);

        if (parsedMessage.type === "pub") {
          const { topic, messageContent } = parsedMessage;
          const method  = parsedMessage.method || 'max_once'; 
          console.log("log : the method is  " ,  method)
          if (method === 'at_least_once') {
            saveMessageToDatabase(topic, messageContent); 
          }

          if (topicSubscribers[topic]) {
            topicSubscribers[topic].forEach(subscriber => {
              subscriber.send(JSON.stringify({ topic, messageContent: messageContent }));
            });
          }
        }


        if(parsedMessage.type === "sub"){ 
          const { topic } = parsedMessage;
          const limit = parsedMessage.limit || 3; 

          if (!topicSubscribers[topic]) {
            topicSubscribers[topic] = [];
          }
          topicSubscribers[topic].push(ws);

          getMessagesFromDatabase(
            topic , limit , (messages) => {
            messages.forEach(msg => {
              ws.send(JSON.stringify({ topic, messageContent: msg.message }));
            });
          });
        }
      }
      catch(e){
          console.error('there is an error ' , e );
      }
  })
  ws.on('close', () => {
    Object.keys(topicSubscribers).forEach(topic => {
      topicSubscribers[topic] = topicSubscribers[topic].filter(sub => sub !== ws);
    });
  })

})

server.listen(8080, () => {
  console.log('Broker running on ws://localhost:8080');
});
