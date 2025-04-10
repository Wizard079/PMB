import {useState} from 'react';
import { useEffect } from 'react';
import { useRef } from 'react';

type Match = {
    id: number;
    matchName: string;
}

type Score = {
    team1Name:string;
    tema2Name:string;
    team1: number;
    team2: number;
    matchName: string;
}

function App() {
    const [allMatches,setAllMatches] = useState<Match[]>([]);
    const [matchScore, setMatchScore] = useState<Score|null>(null);
    const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
    const [notifications,setNotifications] = useState<string[]>([]);
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    const ws= useRef<WebSocket | null>(null);

    useEffect(()=>{
      ws.current = new WebSocket('ws://localhost:8080/matches');
      ws.current.onopen = () => {
        console.log('WebSocket connection established');
      };
      ws.current.onmessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        console.log('Received message:', data);
        if(data.type === 'score'){
            setMatchScore(data);
            setSelectedMatchId(data.id);
        }
        else if(data.type === 'notification'){
            setNotifications((prev) => [...prev, data.message]);
        }
      }
    },[])


    useEffect(()=>{
      fetch('http://localhost:8080/matches')
            .then(response => response.json())
            .then(data => {
                setAllMatches(data);
            })
            .catch(error => {
                console.error('Error fetching matches:', error);
            });
    },[]);

    function subscribe(id: number){
        if(ws.current){
            ws.current.send(JSON.stringify({type:'sub', topic:id}));
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
                  <button onClick={()=>{
                    setNotifications((prev) => prev.filter((_, i) => i !== index));
                  }} >Cross</button>
                </div>
              ))
            }
            <button onClick={() => setIsPanelOpen(false)}>Close</button>
          </div>
        ): (
          <button onClick={() => setIsPanelOpen(true)}>Open Notifications</button>
        )}
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
