
// component to make cricket matches, with 2 input fields where we write the name of the teams, and on the right side we can view the current 
// matches, and when we click on a match, we can start the match, then on every ball we can select runs from 1,2,3,4,6, and wicket.
import { useEffect, useState } from "react"
import axios from "axios"

interface Match {
  id: number
  team1: string
  team2: string
  status: string
  runs1: number
  balls1: number
  wickets1: number
  runs2: number
  balls2: number
  wickets2: number
}
const NUM_OVERS  = 3
const typeofBalls = ["1", "2", "3", "4", "6", "W", "NB", "WD"]

function App() {

  const [matches, setMatches] = useState<Match[]>([])
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null)
  const [currentBall, setCurrentBall] = useState(0)
  const [currentRuns, setCurrentRuns] = useState(0)
  const [currentWickets, setCurrentWickets] = useState(0)

  const [isModalOpen, setIsModalOpen] = useState(false)

  async function statusChange() {
    if (currentMatch) {
      if (currentMatch.status === "NOT_STARTED") {
        const res = await axios.put(`http://localhost:3000/match/${currentMatch.id}`, {
          status: "IN_PROGRESS"
        })
        console.log(res.data)
      }
      if (currentMatch.status === "IN_PROGRESS") {
        const res = await axios.put(`http://localhost:3000/match/${currentMatch.id}`, {
          status: "COMPLETED"
        })
      }
    }
  }

  async function updateMatch() {
    if (currentMatch) {
      const res = await axios.put(`http://localhost:3000/match/${currentMatch.id}`, {
        runs: currentRuns,
        balls: currentBall,
        wickets: currentWickets
      })
      console.log(res.data)
      
    }
  }
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
            <div className=" w-[650px] max-h-[500px] overflow-auto rounded-lg  flex flex-col gap-5 p-5">
              {matches.map((match) => (
                <div key={match.id} className="bg-white flex-shrink-0 w-full h-[125px] rounded-lg shadow-md flex justify-center items-center">
                  <div className="text-center flex flex-col items-center gap-4 w-full">
                    <div className="text-[20px] text-green-900 flex justify-center gap-10 w-full">
                      <div>{match.team1}</div>
                      <div>vs</div>
                      <div>{match.team2}</div>
                    </div>
                    <button onClick={() => {
                      setCurrentMatch(match)
                      setIsModalOpen(true)
                      // setCurrentBall(match.balls1 + match.balls2)
                    }} className="bg-green-900 w-[150px] text-white px-4 py-2 rounded-lg hover:bg-green-950">
                      View Match
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {currentMatch && isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 ">
          <div className="bg-white rounded-lg p-3 w-[800px] h-[300px] relative flex flex-col justify-center items-center">
            <h1 className="text-[35px] text-green-900 mb-5">Match Details</h1>
            <div className="flex flex-col gap-5 w-full items-center">
              <div className="flex justify-around w-[70%]">
                <div className="text-[25px] font-semibold text-green-900">{currentMatch?.team1}</div>
                <div className="text-[22px] text-green-900">vs</div>
                <div className="text-[25px] font-semibold text-green-900">{currentMatch?.team2}</div>
              </div>
              {
                currentMatch.status === "NOT_STARTED" && (
                  <button onClick={statusChange} className="text-xl mt-2 bg-green-900 hover:bg-green-950 text-white p-4 rounded-2xl">Start Match</button>
                )
              }
              {
                currentMatch.status === "IN_PROGRESS" && (
                  <>
                    <div className="flex gap-10 justify-between">
                      <div className="text-[20px] text-green-900">Runs: {currentMatch?.runs}</div>
                      <div className="text-[20px] text-green-900">Wickets: {currentMatch?.wickets}</div>
                      <div className="text-[20px] text-green-900">Balls: {currentMatch?.balls}</div>
                    </div>
                    <div className="flex gap-5">
                      {typeofBalls.map((ball) => (
                        <button key={ball} onClick={() => {
                          if (ball === "W") {
                            setCurrentWickets(currentWickets + 1)
                          } else {
                            setCurrentRuns(currentRuns + parseInt(ball))
                          }
                        }} className="bg-green-900 text-white px-4 py-2 rounded-lg hover:bg-green-950">
                          {ball}
                        </button>
                      ))}
                    </div>
                  </>
                )
              }
              {
                currentMatch.status === "COMPLETED" && (

                  <div className="text-[20px] text-green-900">Match Completed</div>
                )
              }

              <button onClick={() => {
                setCurrentMatch(null)
                setIsModalOpen(false)
                setCurrentBall(0)
                setCurrentRuns(0)
                setCurrentWickets(0)
              }
              } className="bg-red-900 absolute m-1 top-0 right-0 text-white px-4 py-2 rounded-lg hover:bg-red-950">
                X
              </button>
            </div>
          </div>
        </div>
      )}
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
      <button onClick={createMatchHandler} className="bg-green-900 text-white px-4 py-2 rounded-lg hover:bg-green-950">
        Add Match
      </button>
    </div>
  )
}

export default App
