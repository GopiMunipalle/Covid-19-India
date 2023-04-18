const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`Db Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertDbToResponse = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

//Get states
app.get("/states/", async (request, response) => {
  const getStatesQuery = `SELECT *
    FROM state;`;
  const getStatesArray = await db.all(getStatesQuery);
  response.send(getStatesArray.map((each) => convertDbToResponse(each)));
});

//Get state
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getState = `SELECT *
    FROM state
    WHERE state_id=${stateId};`;
  const getStateArray = await db.get(getState);
  response.send(convertDbToResponse(getStateArray));
});

//Post District
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const addDistrict = `INSERT INTO
    district (district_name,state_id,cases,cured,active,deaths)
    VALUES (
        '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
    );`;
  const addDistrictArray = await db.run(addDistrict);
  response.send("District Successfully Added");
});

//Get District
const convertDbTogetDistrict = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrict = `SELECT *
    FROM district
    WHERE district_id=${districtId};`;
  const getDistrictArray = await db.get(getDistrict);
  response.send(convertDbTogetDistrict(getDistrictArray));
});

//Delete District
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrict = `DELETE FROM
    district
    WHERE district_id=${districtId};`;
  const deleteDistrictArray = await db.run(deleteDistrict);
  response.send("District Removed");
});

//update District
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrict = `UPDATE district
  SET
    district_name='${districtName}',
    state_id=${stateId},
    cases=${cases},
    cured=${cured},
    active=${active},
    deaths=${deaths}
  WHERE district_id=${districtId};`;
  const updateQuery = await db.run(updateDistrict);
  response.send("District Details Updated");
});

//Total CasesAciveDeaths
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const totals = `SELECT sum(cases) as totalCases,
    sum(cured) as totalCured,
    sum(active) as totalActive,
    sum(deaths) as totalDeaths
    FROM district
    WHERE state_id=${stateId};`;
  const totalsArray = await db.get(totals);
  response.send(totalsArray);
});

//DistrictNames
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `
select state_id from district
WHERE district_id = ${districtId};`;
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery);

  const getStateNameQuery = `
select state_name as stateName from state
 where state_id = ${getDistrictIdQueryResponse.state_id};`;
  const getStateNameQueryResponse = await db.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});

module.exports = app;
