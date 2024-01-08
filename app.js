const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const dbPath = path.join(__dirname, 'cricketMatchDetails.db')
const app = express()

app.use(express.json())

let db = null
const initailizeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`ERROR DB:${e.message}`)
    process.exit(1)
  }
}

initailizeDBAndServer()

const convertoplayersObj = player => {
  return {
    playerId: player.player_id,
    playerName: player.player_name,
  }
}

const convertomatchObj = match => {
  return {
    matchId: match.match_id,
    match: match.match,
    year: match.year,
  }
}

const convertoplayersScoreObj = player => {
  return {
    playerId: player.player_id,
    playerName: player.player_name,
    totalScore: player.totalScore,
    totalFours: player.totalFours,
    totalSixes: player.totalSixes,
  }
}
///GET LIST of players
app.get('/players/', async (request, response) => {
  const getplayersQuery = `SELECT *
    FROM player_details`
  const playerArray = await db.all(getplayersQuery)
  response.send(playerArray.map(eachplayer => convertoplayersObj(eachplayer)))
})

///GET player
app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getplayersQuery = `SELECT *
    FROM player_details WHERE player_id=${playerId}`
  const player = await db.get(getplayersQuery)
  response.send(convertoplayersObj(player))
})

///UPDATE player
app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const playerdetails = request.body
  const {playerName} = playerdetails
  const updatePlayerQuery = `UPDATE
    player_details SET player_name="${playerName}"
    WHERE player_id=${playerId}`
  const player = await db.run(updatePlayerQuery)
  response.send('Player Details Updated')
})

///GET match
app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getmatchQuery = `SELECT *
    FROM match_details WHERE match_id=${matchId}`
  const match = await db.get(getmatchQuery)
  response.send(convertomatchObj(match))
})

///GET list of matches
app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const getmatchQuery = `SELECT match_details.match_id as match_id,match_details.match as match,match_details.year as year
    FROM  match_details NATURAL JOIN  player_match_score  WHERE player_id=${playerId};`
  const matchesArray = await db.all(getmatchQuery)
  response.send(matchesArray.map(eachmatch => convertomatchObj(eachmatch)))
})

///GET LIST of players of matchId
app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getplayersQuery = `SELECT player_id,player_name
    FROM player_details NATURAL JOIN player_match_score WHERE match_id=${matchId};`
  const playerArray = await db.all(getplayersQuery)
  response.send(playerArray.map(eachplayer => convertoplayersObj(eachplayer)))
})

app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const getTotalQuery = `SELECT player_id,player_name,SUM(score) as totalScore,SUM(fours) as totalFours,SUM(sixes) as totalSixes FROM player_details NATURAL JOIN player_match_score WHERE player_id=${playerId};`
  const player = await db.get(getTotalQuery)
  response.send(convertoplayersScoreObj(player))
})

module.exports = app
