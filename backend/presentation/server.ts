import express from 'express';
import serverless from 'serverless-http';
import { createMemberRouter } from './routes/memberRoutes.js';
import { createPaymentRouter } from './routes/paymentRoutes.js';
import { createLabMemberRouter } from './routes/labMemberRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { authMiddleware } from './middlewares/authMiddleware.js';
import { LabMemberRepositoryImpl } from '../infrastructure/repositories/LabMemberRepositoryImpl.js';
import { UserRepositoryImpl } from '../infrastructure/repositories/UserRepositoryImpl.js';
import { SlackRepositoryImpl } from '../infrastructure/external/SlackRepositoryImpl.js';
import { PaymentCalculator } from '../domain/services/PaymentCalculator.js';

const app = express();

app.use(express.json());

// 依存性の注入（DI）
const labMemberRepository = new LabMemberRepositoryImpl();
const userRepository = new UserRepositoryImpl();
const slackRepository = new SlackRepositoryImpl();
const paymentCalculator = new PaymentCalculator();

// ルーターの生成
const memberRouter = createMemberRouter(userRepository, labMemberRepository, slackRepository);
const paymentRouter = createPaymentRouter(userRepository, labMemberRepository, slackRepository, paymentCalculator);
const labMemberRouter = createLabMemberRouter(labMemberRepository);

// ルーティング
// 認証が不要なルート
app.use('/api/v1/auth', authRoutes);

// 認証が必要なルート
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/members', authMiddleware, memberRouter);
app.use('/api/v1/payments', authMiddleware, paymentRouter);
app.use('/api/v1/lab-members', authMiddleware, labMemberRouter);


app.get('/', (req, res) => {
  res.status(200).send('OK');
});

// Lambdaハンドラとしてエクスポート
export const handler = serverless(app);
