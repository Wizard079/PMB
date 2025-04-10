import { useState } from 'react';
import { useEffect } from 'react';
import { useRef } from 'react';

type Match = {
  id: string; // id's are random so string is better 
  matchName: string;
}

type Score = {
  team1Name: string;
  tema2Name: string;
  team1: number;
  team2: number;
  matchName: string;
}

// for testing purpose, messageContent has the type any
type msg = {
  id: number;
  type: 'pub' | 'sub';  // 'pub' or 'sub' values for type
  topic: string;        // topic name (required)
  limit?: number;       // optional limit (integer) default is 3
  method?: 'at_least_once' | 'max_once'; // required only for publisher only default is 'max_once'
  messageContent?: any;     // required only for publisher only
};

function App() {
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [matchScore, setMatchScore] = useState<Score | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:8080'); // just connect to the ws 
    ws.current.onopen = () => {
      console.log('WebSocket connection established');
    };
    ws.current.onmessage = (event: MessageEvent) => {
      const data: msg = JSON.parse(event.data);
      console.log('Received message:', data);
      if (data.topic === 'score') {
        setMatchScore(data.messageContent);
        setSelectedMatchId(data.id);
      }
      else if (data.topic === 'notification') {
        setNotifications((prev) => [...prev, data.messageContent]);
      }
    }
    setAllMatches([{ id: "qwery1234", matchName: 'rcb Vs srh' }]) // testing purpose 
  }, [])


  useEffect(() => {
    fetch('http://localhost:8080')
      .then(response => response.json())
      .then(data => {
        setAllMatches(data);
      })
      .catch(error => {
        console.error('Error fetching matches:', error);
      });
  }, []);

  function subscribe(id: string) {
    if (ws.current) {
      console.log("the id is : ", id);
      ws.current.send(JSON.stringify({ type: 'sub', topic: id }));
    }
  }

  return (
    <div>
      {isPanelOpen ? (
        <div>
          {
            notifications.map((notification, index) => (
              <div key={index}>
                <p>{notification}</p>
                <button onClick={() => {
                  setNotifications((prev) => prev.filter((_, i) => i !== index));
                }} >Cross</button>
              </div>
            ))
          }
          <button onClick={() => setIsPanelOpen(false)}>Close</button>
        </div>
      ) : (
        <button onClick={() => setIsPanelOpen(true)}>Open Notifications</button>
      )}
      <button onClick={() => subscribe('notification')}>Turn on notification</button>

      {selectedMatchId && matchScore ? (
        <div>
          <h2>Live Score for Match ID: {selectedMatchId}</h2>
          <p>{matchScore.team1Name}: {matchScore.team1}</p>
          <p>{matchScore.tema2Name}: {matchScore.team2}</p>
          <button onClick={() => {
            setSelectedMatchId(null);
            setMatchScore(null);
          }}>
            Back to all matches
          </button>
        </div>
      ) : (
        <div>
          <h1>All matches</h1>
          <ul>
            {allMatches.map((match) => (
              <li onClick={() => subscribe(match.id)} key={match.id}>
                <h2>{match.matchName}</h2>
                <div>{match.id}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>

  )
}

export default App
