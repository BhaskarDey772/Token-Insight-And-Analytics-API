import mongoose from 'mongoose';
import { env } from '@config/env';

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    // eslint-disable-next-line no-console
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    // eslint-disable-next-line no-console
    console.log('MongoDB disconnected');
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('Error during MongoDB disconnect:', error.message);
  }
};

export default connectDB;

