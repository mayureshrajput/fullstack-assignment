import app from './app.js';
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 4000;
app.set('trust proxy', 1);
app.set('x-powered-by', false);

// Optional: disable server timeout for long streams
app.timeout = 0;

app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
