
// component to make cricket matches, with 2 input fields where we write the name of the teams, and on the right side we can view the current 
// matches, and when we click on a match, we can start the match, then on every ball we can select runs from 1,2,3,4,6, and wicket.
import { useState } from "react"
import axios from "axios"

function App() {
  const [ team1, setTeam1 ] = useState("") 
  const [ team2, setTeam2 ] = useState("") 

  async function createMatchHandler(){
    if(!(team1 === "" || team2 === "")){
      console.log(team1, team2)
      const res = await axios.post(`http://localhost:3000/match`,{
        team1,
        team2
      })
      console.log(res.data)
    }
  }

  return (
    <>
      <div className="bg-green-900 h-screen flex justify-center gap-20 items-center flex-col">
        <h1 className="text-white text-[40px] ">Matches</h1>
        <div className="flex gap-10 items-center">
          <div className="bg-white w-[500px] h-[350px] rounded-lg shadow-lg flex justify-center items-center">
            <div className="text-center flex flex-col gap-10">
              <h1 className="text-[30px] text-green-900">Add a Match</h1>
              <div className="form flex flex-col justify-center items-center gap-5">
                <input onChange={(e)=> setTeam1(e.target.value)} type="text" placeholder="Enter Team 1" className="border-black p-2 bg-gray-200 rounded-md" value={team1} />
                <input type="text" placeholder="Enter Team 2" onChange={(e)=> setTeam2(e.target.value)} className="border-black p-2 bg-gray-200 rounded-md" value={team2}/>
                <button onClick={createMatchHandler} className="bg-green-900 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                  Add Match
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white w-[750px] h-[500px] rounded-lg shadow-lg flex justify-center items-center">
            <div className="text-center">
              <h1 className="text-[30px] text-green-900">No Matches</h1>
              <p className="text-gray-500">You have no matches yet.</p>
              <p className="text-gray-500">Start swiping to find your perfect match!</p>
              <button className="bg-green-900 text-white px-4 py-2 mt-4 rounded-lg hover:bg-green-700">
                Start Swiping
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
