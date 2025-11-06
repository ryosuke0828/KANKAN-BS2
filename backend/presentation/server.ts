import express from 'express';
import serverless from 'serverless-http';
import memberRoutes from './routes/memberRoutes';

const app = express();

app.use(express.json());

// ルーティング
app.use('/api/v1/members', memberRoutes);

app.get('/', (req, res) => {
  res.status(200).send('OK');
});

// Lambdaハンドラとしてエクスポート
export const handler = serverless(app);

