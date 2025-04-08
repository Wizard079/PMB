let ws = new WebSocket('ws://localhost:8080');
ws.onmessage = (msg) => console.log('Received:', msg.data);
ws.onopen = () => {
  ws.send(JSON.stringify({ type: 'sub', topic: 'news' }));
};
