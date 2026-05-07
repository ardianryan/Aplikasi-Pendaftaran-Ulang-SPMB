import mongoose from 'mongoose';
import { Setting, DEFAULT_SETTINGS } from './src/backend/models/Setting';
import * as dotenv from 'dotenv';
dotenv.config();

async function seedNewSettings() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log('Connected to DB');

  for (const s of DEFAULT_SETTINGS) {
    const existing = await Setting.findOne({ key: s.key });
    if (!existing) {
      console.log(`Seeding new setting: ${s.key}`);
      await Setting.create(s);
    }
  }

  console.log('Done');
  process.exit(0);
}

seedNewSettings();
