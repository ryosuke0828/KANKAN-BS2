import express from 'express';
import serverless from 'serverless-http';
import memberRoutes from './routes/memberRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js'; // paymentRoutes をインポート

const app = express();

app.use(express.json());

// ルーティング
app.use('/api/v1/members', memberRoutes);
app.use('/api/v1/payments', paymentRoutes); // paymentRoutes を追加

app.get('/', (req, res) => {
  res.status(200).send('OK');
});

// Lambdaハンドラとしてエクスポート
export const handler = serverless(app);