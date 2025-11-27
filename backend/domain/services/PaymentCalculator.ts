import { MemberAttribute } from '../types/MemberAttribute.js';

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

    // 1. totalAmountを10円単位で切り上げる
    const finalTotalAmount = Math.ceil(totalAmount / 10) * 10;

    // 2. attributeごとの合計weightとメンバー数を計算
    const attributeSummary = payers.reduce(
      (
        acc,
        payer,
      ): Record<MemberAttribute, { totalWeight: number; memberCount: number }> => {
        if (!acc[payer.attribute]) {
          acc[payer.attribute] = { totalWeight: 0, memberCount: 0 };
        }
        acc[payer.attribute].totalWeight += payer.weight;
        acc[payer.attribute].memberCount++;
        return acc;
      },
      {} as Record<MemberAttribute, { totalWeight: number; memberCount: number }>,
    );

    // 3. 各attributeグループにfinalTotalAmountをweight比で割り振る
    let totalAllocatedAmount = 0;
    const attributeAllocatedAmounts = {} as Record<MemberAttribute, number>;
    const overallTotalWeight = payers.reduce((sum, p) => sum + p.weight, 0);

    if (overallTotalWeight === 0) {
      // 全体の重みが0の場合、均等割り
      if (payers.length === 0) return [];
      const amountPerPerson =
        Math.ceil((finalTotalAmount / payers.length) / 10) * 10;
      return payers.map(p => ({ memberId: p.memberId, amount: amountPerPerson }));
    }

    (Object.keys(attributeSummary) as MemberAttribute[]).forEach(attribute => {
      const summary = attributeSummary[attribute];
      const allocatedAmountForAttribute = Math.floor(
        (finalTotalAmount * summary.totalWeight) / overallTotalWeight,
      );
      attributeAllocatedAmounts[attribute] = allocatedAmountForAttribute;
      totalAllocatedAmount += allocatedAmountForAttribute;
    });

    // 4. 全体の割り振り誤差を調整
    let remainingDifference = finalTotalAmount - totalAllocatedAmount;
    // 誤差を最も重みの大きいattributeグループに加算する
    if (remainingDifference !== 0) {
      const sortedAttributes = (
        Object.keys(attributeSummary) as MemberAttribute[]
      ).sort(
        (a, b) =>
          attributeSummary[b].totalWeight - attributeSummary[a].totalWeight,
      );
      if (sortedAttributes.length > 0) {
        attributeAllocatedAmounts[sortedAttributes[0]] += remainingDifference;
      }
    }

    // 5. 各attributeグループ内で、割り振られた金額をメンバー数で均等割りし、10円単位で切り上げる
    let results: CalculatedAmount[] = [];
    for (const payer of payers) {
      const allocatedAmountForAttribute = attributeAllocatedAmounts[payer.attribute] || 0;
      const amountPerMember = Math.ceil((allocatedAmountForAttribute / attributeSummary[payer.attribute].memberCount) / 10) * 10;
      results.push({
        memberId: payer.memberId,
        amount: amountPerMember,
      });
    }

    // 最終的な合計金額の確認と調整（念のため）
    const finalCalculatedSum = results.reduce((sum, r) => sum + r.amount, 0);
    if (finalCalculatedSum !== finalTotalAmount) {
      // ここで再度調整が必要になる可能性があるが、上記のロジックでほぼ一致するはず
      // もし差額が生じた場合、最も重みの大きいattributeグループの最初のメンバーに加算する
      const difference = finalTotalAmount - finalCalculatedSum;
      if (difference !== 0 && results.length > 0) {
        results[0].amount += difference;
      }
    }

    return results;
  }
}
