
import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  try {

    const originalFilePath = path.join(__dirname, "../bundle.zip");
    const newFilePath = path.join(__dirname, `../${process.env.APP_NAME}-${process.env.ENVIRONMENT}.zip`);
    await fs.rename(originalFilePath, newFilePath);
  } catch (err) {
  } finally {
    process.exit(process.exitCode || 0);
  }
})();