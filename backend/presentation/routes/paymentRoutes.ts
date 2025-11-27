import { Router, Request, Response } from 'express';
import { CalculatePayment } from '../../application/usecases/payment/CalculatePayment.js';
import { SendPaymentRequestDm } from '../../application/usecases/payment/SendPaymentRequestDm.js';
import { IUserRepository } from '../../domain/interfaces/IUserRepository.js';
import { ILabMemberRepository } from '../../domain/interfaces/ILabMemberRepository.js';
import { ISlackRepository } from '../../domain/interfaces/ISlackRepository.js';
import { PaymentCalculator } from '../../domain/services/PaymentCalculator.js';

export const createPaymentRouter = (
  userRepository: IUserRepository,
  labMemberRepository: ILabMemberRepository,
  slackRepository: ISlackRepository,
  paymentCalculator: PaymentCalculator,
): Router => {
  const router = Router();

  /**
   * POST /api/v1/payments/calculate
   * 支払い金額を計算するエンドポイント
   */
  router.post('/calculate', async (req: Request, res: Response) => {
    const { userId, totalAmount, payers } = req.body;

    if (!userId || totalAmount === undefined || !payers) {
      return res.status(400).json({ error: 'userId, totalAmount, and payers are required.' });
    }

    try {
      const usecase = new CalculatePayment(paymentCalculator);
      const calculatedAmounts = await usecase.execute({ payers, totalAmount });
      res.status(200).json(calculatedAmounts);
    } catch (error: any) {
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
  router.post('/send-dm', async (req: Request, res: Response) => {
    const { userId, paymentRequests, paymentUrl } = req.body;

    if (!userId || !paymentRequests || !paymentUrl) {
      return res.status(400).json({ error: 'userId, paymentRequests, and paymentUrl are required.' });
    }

    try {
      const usecase = new SendPaymentRequestDm(
        userRepository,
        labMemberRepository,
        slackRepository,
      );
      await usecase.execute({ userId, paymentRequests, paymentUrl });
      res.status(200).json({ message: 'Payment request DMs sent successfully.' });
    } catch (error: any) {
      console.error('Error in /send-dm:', error);
      if (error instanceof Error) {
        res.status(500).json({ error: 'An unexpected error occurred.', message: error.message, stack: error.stack });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred.', details: JSON.stringify(error) });
      }
    }
  });

  return router;
};
