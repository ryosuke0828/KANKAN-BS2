import express from 'express';
import serverless from 'serverless-http';
import memberRoutes from './routes/memberRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import labMemberRoutes from './routes/labMemberRoutes.js'; // labMemberRoutes をインポート

const app = express();

app.use(express.json());

// ルーティング
app.use('/api/v1/members', memberRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/lab-members', labMemberRoutes); // labMemberRoutes を追加

app.get('/', (req, res) => {
  res.status(200).send('OK');
});

// Lambdaハンドラとしてエクスポート
export const handler = serverless(app);
