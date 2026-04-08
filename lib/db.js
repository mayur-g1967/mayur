import mongoose from 'mongoose';

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

export default async function connectDB() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const uri = process.env.MONGO_URI;
        if (!uri) {
            throw new Error('Please define the MONGO_URI environment variable inside .env.local');
        }

        const opts = {
            bufferCommands: false,
            dbName: 'User' // Matches your Reminder model requirement
        };

        cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
            console.log(`✅ MongoDB Connected: ${mongooseInstance.connection.host}`);
            console.log(`✅ Database Name: ${mongooseInstance.connection.db.databaseName}`);
            return mongooseInstance;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (error) {
        cached.promise = null;
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        throw error;
    }

    return cached.conn;
}
