import { MongoClient } from 'mongodb';

const url = process.env.mongoURI as string;
const dbName = 'chbot';

let db: any;

export const connectToDatabase = async () => {
    if (db) {
        return db;
    }
    const client = new MongoClient(url);
    await client.connect();
    db = client.db(dbName);
    console.log('Connected to database');
    return db;
};