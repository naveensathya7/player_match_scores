const path = require("path");
const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
  }
};
initializeDBAndServer();
//Snake case to Camel case conversion
const playersListCaseConvertToCamel = (dbObj) => {
  return {
    playerId: dbObj.player_id,
    playerName: dbObj.player_name,
  };
};

//API1 : GET LIST OF ALL PLAYERS
app.get("/players/", async (request, response) => {
  const searchPlayersQuery = `SELECT * FROM player_details ORDER BY player_id;`;
  const playersList = await db.all(searchPlayersQuery);
  response.send(playersList.map((each) => playersListCaseConvertToCamel(each)));
});

//API2 : GET PLAYER DETAILS BY PLAYER_ID

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const searchPlayerQuery = `SELECT * FROM player_details WHERE  player_id=${playerId};`;
  const playerDetails = await db.get(searchPlayerQuery);
  response.send(playersListCaseConvertToCamel(playerDetails));
});

//API3 :UPDATE PLAYER DETAILS

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `UPDATE player_details SET player_name='${playerName}'`;

  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//API4 :GET MATCH DETAILS OF A SPECIFIC MATCH

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const searchMatchQuery = `SELECT match_id AS matchId,
  match,year FROM match_details WHERE  match_id=${matchId};`;
  const matchDetails = await db.get(searchMatchQuery);
  response.send(matchDetails);
});

//API5 :GET ALL MATCH DETAILS PLAYED BY A PLAYER

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const searchMatchQuery = `SELECT match_details.match_id AS matchId,
  match,year FROM match_details
  INNER JOIN player_match_score ON match_details.match_id=player_match_score.match_id
   WHERE  player_id=${playerId};`;
  const matchDetails = await db.all(searchMatchQuery);
  response.send(matchDetails);
});

//API6 :GET PLAYERS OF A SPECIFIC MATCH
app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const searchPlayersQuery = `SELECT
	      player_details.player_id AS playerId,
	      player_details.player_name AS playerName
	    FROM player_match_score NATURAL JOIN player_details
        WHERE match_id=${matchId};`;
  const playersDetails = await db.all(searchPlayersQuery);
  response.send(playersDetails);
});

//API7 :GET PLAYER STATISTICS
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const searchStatsQuery = `SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};`;
  const playersDetails = await db.get(searchStatsQuery);
  response.send(playersDetails);
});

module.exports = app;
