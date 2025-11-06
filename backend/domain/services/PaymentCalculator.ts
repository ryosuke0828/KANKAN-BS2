import { MemberAttribute } from '../types/MemberAttribute';

// 計算に必要なメンバー情報
export interface Payer {
  memberId: string;
  attribute: MemberAttribute;
  weight: number;
}

// 計算結果
export interface CalculatedAmount {
  memberId: string;
  amount: number;
}

export class PaymentCalculator {
  calculate(payers: Payer[], totalAmount: number): CalculatedAmount[] {
    if (totalAmount <= 0) {
      return payers.map(p => ({ memberId: p.memberId, amount: 0 }));
    }

    const totalWeight = payers.reduce((sum, payer) => sum + payer.weight, 0);

    // 重みの合計が0の場合、均等に割る
    if (totalWeight === 0) {
      if (payers.length === 0) return [];
      const amountPerPerson = Math.floor(totalAmount / payers.length);
      const results = payers.map(p => ({ memberId: p.memberId, amount: amountPerPerson }));

      // 割り切れなかった端数を最初の人に加算
      const remainder = totalAmount % payers.length;
      if (remainder > 0) {
        results[0].amount += remainder;
      }
      return results;
    }

    const unitPrice = totalAmount / totalWeight;
    let calculatedSum = 0;

    const results = payers.map(payer => {
      const amount = Math.floor(unitPrice * payer.weight);
      calculatedSum += amount;
      return {
        memberId: payer.memberId,
        amount: amount,
      };
    });

    // 丸め誤差による差額を、重みが最も大きい人（または最初の人）に加算して調整
    const difference = totalAmount - calculatedSum;
    if (difference > 0) {
      // 簡単のため、リストの最初のメンバーに加算する
      if(results.length > 0) {
        results[0].amount += difference;
      }
    }

    return results;
  }
}
