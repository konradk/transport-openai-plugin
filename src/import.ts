import fs from 'fs';
import csv from 'csv-parser';
import stripBomStream from 'strip-bom-stream';
import Database from 'better-sqlite3';

type Column = { name: string, type: string };
type TableData = { tableName: string, columns: Column[] };

const importData = () => {
    let db = new Database('gtfs.db');
    async function initGtfsTables(dbPath: string, gtfsPath: string, tableData: TableData): Promise<void> {
        db = new Database(dbPath);
    
        const columnDefs = tableData.columns.map(column => `${column.name} ${column.type}`).join(',');
        const createTableSql = `CREATE TABLE IF NOT EXISTS ${tableData.tableName} (${columnDefs})`;
        db.prepare(createTableSql).run();
    
        fs.createReadStream(gtfsPath)
            .pipe(stripBomStream())
            .pipe(csv())
            .on('data', (data) => {
                const insertValues = tableData.columns.map(column => data[column.name]);
                const placeholders = new Array(tableData.columns.length).fill('?').join(',');
                const insertSql = `INSERT INTO ${tableData.tableName} VALUES (${placeholders})`;
                db.prepare(insertSql).run(...insertValues);
            })
            .on('end', () => {
                console.log(`Finished importing GTFS data into ${tableData.tableName}.`);
                db.close();
            });
    }
    
    const runImport = async () => {
        console.log('Importing GTFS data into SQLite database...');
        initGtfsTables('gtfs.db', 'data/stops.txt', {
            tableName: 'stops',
            columns: [
                { name: 'stop_id', type: 'TEXT PRIMARY KEY' },
                { name: 'stop_code', type: 'TEXT' },
                { name: 'stop_name', type: 'TEXT' },
                { name: 'stop_lat', type: 'REAL' },
                { name: 'stop_lon', type: 'REAL' },
            ]
        });
    
        initGtfsTables('gtfs.db', 'data/variants.txt', {
            tableName: 'variants',
            columns: [
                { name: 'variant_id', type: 'INTEGER PRIMARY KEY' },
                { name: 'is_main', type: 'INTEGER' },
                { name: 'equiv_main_variant_id', type: 'INTEGER' },
                { name: 'join_stop_id', type: 'TEXT' },
                { name: 'disjoin_stop_id', type: 'TEXT' },
            ]
        });
    
        initGtfsTables('gtfs.db', 'data/routes.txt', {
            tableName: 'routes',
            columns: [
                { name: 'route_id', type: 'TEXT PRIMARY KEY' },
                { name: 'agency_id', type: 'INTEGER' },
                { name: 'route_short_name', type: 'TEXT' },
                { name: 'route_long_name', type: 'TEXT' },
                { name: 'route_desc', type: 'TEXT' },
                { name: 'route_type', type: 'INTEGER' },
                { name: 'route_type2_id', type: 'INTEGER' },
                { name: 'valid_from', type: 'TEXT' },
                { name: 'valid_until', type: 'TEXT' },
            ]
        });
    
    
        initGtfsTables('gtfs.db', 'data/trips.txt', {
            tableName: 'trips',
            columns: [
                { name: 'route_id', type: 'TEXT' },
                { name: 'service_id', type: 'INTEGER' },
                { name: 'trip_id', type: 'TEXT' },
                { name: 'trip_headsign', type: 'TEXT' },
                { name: 'direction_id', type: 'INTEGER' },
                { name: 'shape_id', type: 'INTEGER' },
                { name: 'brigade_id', type: 'INTEGER' },
                { name: 'vehicle_id', type: 'INTEGER' },
                { name: 'variant_id', type: 'INTEGER' },
            ]
        });
    
        initGtfsTables('gtfs.db', 'data/stop_times.txt', {
            tableName: 'stop_times',
            columns: [
                { name: 'trip_id', type: 'TEXT' },
                { name: 'arrival_time', type: 'TEXT' },
                { name: 'departure_time', type: 'TEXT' },
                { name: 'stop_id', type: 'TEXT' },
                { name: 'stop_sequence', type: 'INTEGER' },
                { name: 'pickup_type', type: 'INTEGER' },
                { name: 'drop_off_type', type: 'INTEGER' },
            ]
        });
        initGtfsTables('gtfs.db', 'data/route_types.txt', {
            tableName: 'route_types',
            columns: [
                { name: 'route_type2_id', type: 'INTEGER PRIMARY KEY' },
                { name: 'route_type2_name', type: 'TEXT' },
            ]
        });
    }

    runImport()
}

importData()
