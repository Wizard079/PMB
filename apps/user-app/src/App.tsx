import { useState, useEffect, useRef } from 'react';
import { Bell, X, ArrowLeftCircle } from 'lucide-react';
import axios, { all } from "axios"


interface wsData {
  topic: string,
  messageContent: string,

}
interface Match {
  id: number
  team1: string
  team2: string
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED"
  runs1: number
  balls1: number
  wickets1: number
  runs2: number
  balls2: number
  wickets2: number
}
type Score = {
  team1Name: string;
  team2Name: string;
  team1: number;
  team2: number;
  matchName: string;
};



function App() {
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [matchScore, setMatchScore] = useState<Score | null>(null);
  // const [matchStatus, setMatchStatus] = useState<MatchStatus | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:3001'); // just connect to the ws 
    ws.current.onopen = () => {
      console.log('WebSocket connection established');
    };
    ws.current.onmessage = (event: MessageEvent) => {
      const data: wsData = JSON.parse(event.data);
      const msg = JSON.parse(data.messageContent);
      console.log('Received message:', data);
      if (msg.status === "NOT_STARTED") {
        setAllMatches(() => {
          return allMatches.map(match => {
            if (String(match.id) === data.topic) {
              return { ...match, status: "IN_PROGRESS" }; // ← return the updated match
            } else {
              return match;
            }
          });
        });
      } else if (data.topic === 'notification') {
        setNotifications((prev) => [...prev, data.messageContent]);
      }
    };
  }, [allMatches]);

  useEffect(() => {
    async function fetchMatches() {
      const res = await axios.get(`http://localhost:3000/match`)
      console.log(res.data)
      setAllMatches(res.data)
    }
    fetchMatches()
  }, [])

  function subscribe(id: string) {
    if (ws.current) {
      console.log("Subscribe to ", id);
      ws.current.send(JSON.stringify({ topic: id }));
    }
    else {
      alert('fail to subscribe')
    }
  }

  return (
    <div
      className="min-h-screen bg-gray-900 p-6 flex flex-col font-sans text-white"
      style={{
        backgroundImage: "url('https://source.unsplash.com/1600x900/?cricket,stadium')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Header with Title and Notification Buttons */}
      <header className="w-full flex flex-col sm:flex-row items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <span className="text-4xl">🏏</span>
          <h1 className="text-3xl font-bold text-blue-300">Cricket Fever</h1>
        </div>
        <div className="flex gap-4 mt-4 sm:mt-0">
          <button
            onClick={() => subscribe('notification')}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 focus:outline-none"
          >
            Turn on Notifications
          </button>
          <button
            onClick={() => setIsPanelOpen(true)}
            className="flex items-center gap-2 bg-blue-600 px-4 py-2 rounded hover:bg-blue-500 focus:outline-none"
          >
            <Bell className="w-5 h-5" />
            <span>Notifications</span>
          </button>
        </div>
      </header>

      {/* Notifications Panel */}
      {isPanelOpen && (
        <div className="fixed top-0 right-0 h-full w-80 bg-gray-800 shadow-lg p-4 overflow-y-auto z-50">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Notifications</h2>
            <button onClick={() => setIsPanelOpen(false)} className="p-1">
              <X className="w-6 h-6 text-gray-400 hover:text-red-500" />
            </button>
          </div>
          {notifications.length === 0 ? (
            <p className="text-gray-400">No notifications</p>
          ) : (
            notifications.map((notification, index) => (
              <div key={index} className="flex justify-between items-start bg-gray-700 p-3 rounded mb-3">
                <p className="text-sm">{notification}</p>
                <button onClick={() => setNotifications((prev) => prev.filter((_, i) => i !== index))}>
                  <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Main Content: Centered Matches / Live Score */}
      <main className="flex-grow flex items-center justify-center">
        {selectedMatchId && matchScore ? (
          <div className="bg-gray-800 shadow-md rounded-lg p-6 text-center w-full max-w-md">
            <h2 className="text-2xl font-bold text-blue-400 mb-4">Live Cricket Score</h2>
            <p className="text-lg mb-3">
              {matchScore.team1Name}: <span className="font-semibold text-white">{matchScore.team1}</span>
            </p>
            <p className="text-lg mb-5">
              {matchScore.team2Name}: <span className="font-semibold text-white">{matchScore.team2}</span>
            </p>
            <button
              onClick={() => {
                setSelectedMatchId(null);
                setMatchScore(null);
              }}
              className="flex items-center mx-auto text-sm bg-gray-700 px-4 py-2 rounded hover:bg-gray-600 focus:outline-none"
            >
              <ArrowLeftCircle className="w-5 h-5 mr-2" />
              Back to Matches
            </button>
          </div>
        ) : (
          <div className="bg-gray-800 shadow-md rounded-lg p-6 w-full max-w-2xl">
            <h1 className="text-3xl font-bold mb-6 text-blue-400 text-center">Live Cricket Action</h1>
            <ul className="space-y-4 flex flex-col items-center">
              {allMatches.map((match) => (
                <li
                  key={match.id}
                  onClick={() => subscribe(match.id.toString())}
                  className="cursor-pointer p-4 bg-gray-700 rounded hover:bg-gray-600 transition-colors w-full max-w-md"
                >
                  <h2 className="text-xl font-semibold text-blue-200 text-center">{match.team1} VS {match.team2}</h2>
                  <p className="text-sm text-gray-300 text-center">{match.id}</p>
                  <p className="text-sm text-gray-300 text-center">{match.status}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>

      {/* Footer with a Cricket Theme Message */}
      <footer className="mt-10 text-gray-500 text-sm text-center">
        <p>Powered by Cricket Live Scores</p>
      </footer>
    </div>
  );
}

export default App;
