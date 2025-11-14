import { Router } from 'express';
import { CalculatePayment } from '../../application/usecases/payment/CalculatePayment.js';
import { SendPaymentRequestDm } from '../../application/usecases/payment/SendPaymentRequestDm.js';
import { UserRepositoryImpl } from '../../infrastructure/repositories/UserRepositoryImpl.js';
import { LabMemberRepositoryImpl } from '../../infrastructure/repositories/LabMemberRepositoryImpl.js';
import { SlackRepositoryImpl } from '../../infrastructure/external/SlackRepositoryImpl.js';
import { PaymentCalculator } from '../../domain/services/PaymentCalculator.js';

const router = Router();

/**
 * POST /api/v1/payments/calculate
 * 支払い金額を計算するエンドポイント
 */
router.post('/calculate', async (req, res) => {
  const { userId, totalAmount, payers } = req.body;

  if (!userId || totalAmount === undefined || !payers) {
    return res.status(400).json({ error: 'userId, totalAmount, and payers are required.' });
  }

  try {
    // DIコンテナがないため、手動で依存性を注入（インスタンス化）する
    const paymentCalculator = new PaymentCalculator();
    const usecase = new CalculatePayment(paymentCalculator);

    const calculatedAmounts = await usecase.execute({ payers, totalAmount });

    res.status(200).json(calculatedAmounts);
  } catch (error) {
    console.error('Error in /calculate:', error);
    if (error instanceof Error) {
        res.status(500).json({ error: 'An unexpected error occurred.', message: error.message, stack: error.stack });
    } else {
        res.status(500).json({ error: 'An unexpected error occurred.', details: JSON.stringify(error) });
    }
  }
});

/**
 * POST /api/v1/payments/send-dm
 * 支払いリクエストDMを送信するエンドポイント
 */
router.post('/send-dm', async (req, res) => {
  const { userId, paymentRequests, paymentUrl } = req.body;

  if (!userId || !paymentRequests || !paymentUrl) {
    return res.status(400).json({ error: 'userId, paymentRequests, and paymentUrl are required.' });
  }

  try {
    // DIコンテナがないため、手動で依存性を注入（インスタンス化）する
    const userRepository = new UserRepositoryImpl();
    const labMemberRepository = new LabMemberRepositoryImpl();
    const slackRepository = new SlackRepositoryImpl();
    const usecase = new SendPaymentRequestDm(
      userRepository,
      labMemberRepository,
      slackRepository
    );

    await usecase.execute({ userId, paymentRequests, paymentUrl });

    res.status(200).json({ message: 'Payment request DMs sent successfully.' });
  } catch (error) {
    console.error('Error in /send-dm:', error);
    if (error instanceof Error) {
        res.status(500).json({ error: 'An unexpected error occurred.', message: error.message, stack: error.stack });
    } else {
        res.status(500).json({ error: 'An unexpected error occurred.', details: JSON.stringify(error) });
    }
  }
});

export default router;
