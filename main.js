let ws = new WebSocket('ws://localhost:8080');
ws.onmessage = (msg) => console.log('Received:', msg.data);

function publish(ws, topic, message) {
    ws.send(JSON.stringify({ type: 'pub', topic: topic, message: message }));
    console.log("sending the info")
}

function subscribe(ws, topic) {
    ws.send(JSON.stringify({ type: 'sub', topic: topic }));
    console.log("Subscribe susses");
}



const pubBtn = document.getElementById("pub");
const pubInput = document.getElementById("pubInput");
const pubTopic = document.getElementById("pubTopic");

pubBtn.addEventListener('click', () => {
    const msg = pubInput.value.trim();
    const topic = pubTopic.value.trim();
    
    // console.log(`the topic for pub is ${topic} and the message is ${msg}`)
    publish(ws, topic, msg); 
})
const subBtn = document.getElementById("sub"); 
const subInput = document.getElementById("subInput");


subBtn.addEventListener('click', () => {
    const topic = subInput.value.trim();
    // console.log('the topic for the sub is : ' , topic)
    subscribe(ws, topic); 
})

