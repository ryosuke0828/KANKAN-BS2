import {
  PaymentCalculator,
  Payer,
  CalculatedAmount,
} from '../../domain/services/PaymentCalculator.js';

// ユースケースの入力データ型
export interface CalculatePaymentInput {
  payers: Payer[];
  totalAmount: number;
}

// ユースケースの出力データ型
export type CalculatePaymentOutput = CalculatedAmount[];

export class CalculatePayment {
  constructor(private readonly paymentCalculator: PaymentCalculator) {}

  async execute(
    input: CalculatePaymentInput,
  ): Promise<CalculatePaymentOutput> {
    const { payers, totalAmount } = input;

    // ドメインサービスを呼び出して計算を実行
    const calculatedAmounts = this.paymentCalculator.calculate(
      payers,
      totalAmount,
    );

    return calculatedAmounts;
  }
}
