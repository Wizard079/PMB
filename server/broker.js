const http = require('http')
const WebSocket = require('ws')



const server = http.createServer()
const wss = new WebSocket.Server( { server }); 


function handleOfflineClient() {
  return 1;
}

const topics = {}
wss.on('connection' , (ws) => {
  ws.on('message' , (msg) => {
      try{
        const { type , topic , message } = JSON.parse(msg);

        if(type === "sub"){
          if (!topics[topic]) topics[topic] = new Set();
          topics[topic].add(ws);
        }

        if(type === "pub"){
          const subscribers = topics[topic] || [];
          for(let client of subscribers){
            if(client.readyState === WebSocket.OPEN){
              const msg = JSON.stringify({topic , message});
              client.send(msg);
              console.log(`${msg}`)
            }
            else{
              console.log('Client is offline handle this .. for persistence storage');
              handleOfflineClient();
            }
          }
        }
      }
      catch(e){
          console.error('there is error ' , e );
      }
  })
  ws.on('close', () => {
    for (let subs of Object.values(topics)) {
      subs.delete(ws)
    }
  })

})

server.listen(8080, () => {
  console.log('Broker running on ws://localhost:8080');
});
