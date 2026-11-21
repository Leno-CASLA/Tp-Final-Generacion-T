// backend/src/server.js
import dotenv from 'dotenv';
import { createApp } from './app.js';

dotenv.config();

const port = process.env.PORT || 3000;
const app = createApp();

app.listen(port, () => {
  console.log(`CanchaYa backend escuchando en puerto ${port}`);
});