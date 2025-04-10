
// component to make cricket matches, with 2 input fields where we write the name of the teams, and on the right side we can view the current 
// matches, and when we click on a match, we can start the match, then on every ball we can select runs from 1,2,3,4,6, and wicket.
import { useEffect, useState } from "react"
import { MatchStatus } from "@repo/db"
import axios from "axios"

interface Match {
  id: number
  team1: string
  team2: string
  status: MatchStatus
  runs: number
  balls: number
  wickets: number
}

function App() {

  const [matches, setMatches] = useState<Match[]>([])
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null)
  const [currentBall, setCurrentBall] = useState(0)
  const [currentRuns, setCurrentRuns] = useState(0)
  const [currentWickets, setCurrentWickets] = useState(0)


  useEffect(() => {
    async function fetchMatches() {
      const res = await axios.get(`http://localhost:3000/match`)
      console.log(res.data)
      setMatches(res.data)
    }
    fetchMatches()
  }, [])

  return (
    <>
      <div className="bg-green-900 h-screen flex justify-center gap-20 items-center flex-col">
        <h1 className="text-white text-[50px] ">Cricket Fever Admin</h1>
        <div className="flex gap-10 items-center">
          <div className="bg-white w-[500px] h-[350px] rounded-lg shadow-lg flex justify-center items-center">
            <div className="text-center flex flex-col gap-10">
              <h1 className="text-[30px] text-green-900">Add a Match</h1>
              <CreateMatchComponent />
            </div>
          </div>

          <div className="text-center">

            <h1 className="text-[30px] text-white">Existing Matches</h1>
            <div className=" w-[750px] max-h-[600px] rounded-lg  flex flex-col justify-center items-center">
              {matches.map((match) => (
                <div key={match.id} className="bg-white w-full h-[100px] rounded-lg shadow-md flex justify-center items-center mb-5">
                  <div className="text-center flex flex-col gap-2">
                    <h1 className="text-[20px] text-green-900">{match.team1} vs {match.team2}</h1>
                    <button onClick={() => setCurrentMatch(match)} className="bg-green-900 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                      Start Match
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function CreateMatchComponent() {
  const [team1, setTeam1] = useState("")
  const [team2, setTeam2] = useState("")

  async function createMatchHandler() {
    if (!(team1 === "" || team2 === "")) {
      console.log(team1, team2)
      const res = await axios.post(`http://localhost:3000/match`, {
        team1,
        team2
      })
      console.log(res.data)
    }
  }


  return (
    <div className="form flex flex-col justify-center items-center gap-5">
      <input onChange={(e) => setTeam1(e.target.value)} type="text" placeholder="Enter Team 1" className="border-black p-2 bg-gray-200 rounded-md" value={team1} />
      <input type="text" placeholder="Enter Team 2" onChange={(e) => setTeam2(e.target.value)} className="border-black p-2 bg-gray-200 rounded-md" value={team2} />
      <button onClick={createMatchHandler} className="bg-green-900 text-white px-4 py-2 rounded-lg hover:bg-green-700">
        Add Match
      </button>
    </div>
  )
}

export default App
