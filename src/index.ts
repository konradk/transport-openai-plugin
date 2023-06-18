import Database from 'better-sqlite3';

import express from "express";
import cors from 'cors'
import bodyParser from 'body-parser'

const app = express();
app.use(cors())
app.use(bodyParser.json());
app.use(express.static("public"));

let db = new Database('gtfs.db');

const port = process.env.PORT || 4002;

app.get('/trips/:route_id', (req, res) => {
    const route_id = req.params.route_id;

    const sql = `
        SELECT * 
        FROM trips 
        INNER JOIN variants ON trips.variant_id = variants.variant_id 
        WHERE route_id = ? AND variants.is_main = 1
    `;
    const trips = db.prepare(sql).all(route_id);

    res.json(trips);
});

app.get('/stop_times/:route_id/:stop_id', (req, res) => {
    const { route_id, stop_id } = req.params;
    const time = req.query.time || '00:00:00';

    const sql = `
        SELECT stop_times.* 
        FROM stop_times
        INNER JOIN trips ON stop_times.trip_id = trips.trip_id
        WHERE trips.route_id = ? 
          AND stop_times.stop_id = ? 
          AND stop_times.departure_time >= ?
        ORDER BY stop_times.departure_time
        LIMIT 10
    `;
    const stopTimes = db.prepare(sql).all(route_id, stop_id, time);

    res.json(stopTimes);
});

app.get('/current_time', (_, res) => {
    const currentTime = new Date().toTimeString().split(' ')[0];
    res.json({time: currentTime});
});

app.get('/stops/search/:name', (req, res) => {
    const name = req.params.name;

    const sql = `
        SELECT * 
        FROM stops 
        WHERE stop_name LIKE ? 
        ORDER BY 
            CASE 
                WHEN stop_name LIKE ? THEN 1
                ELSE 2 
            END, 
            stop_name
    `;
    const stops = db.prepare(sql).all(`%${name}%`, `${name}%`);

    res.json(stops);
});

app.get('/routes', (_, res) => {
    const sql = `
    SELECT route_id, routes.route_type2_id, route_types.route_type2_name
    FROM routes 
    INNER JOIN route_types ON routes.route_type2_id = route_types.route_type2_id
    `;
    const routes = db.prepare(sql).all();

    res.json(routes);
});


app.listen(port, () => {
    console.log(`Hi! Example app listening on port ${port}`);
});
