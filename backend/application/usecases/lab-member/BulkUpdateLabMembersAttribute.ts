import { LabMember } from '../../../domain/entities/LabMember.js';
import { ILabMemberRepository } from '../../../domain/interfaces/ILabMemberRepository.js';
import { MemberAttribute } from '../../../domain/types/MemberAttribute.js';

export interface BulkUpdateLabMembersAttributeInput {
  userId: string; // 一括更新を行うユーザーのID
}

export interface BulkUpdateLabMembersAttributeOutput {
  updatedCount: number;
  // 必要であれば、更新されたメンバーのIDリストなどを追加
}

export class BulkUpdateLabMembersAttribute {
  private readonly promotionOrder: MemberAttribute[] = ['B3', 'B4', 'M1', 'M2']; // D, P, Others は含まない

  constructor(private readonly labMemberRepository: ILabMemberRepository) {}

  async execute(input: BulkUpdateLabMembersAttributeInput): Promise<BulkUpdateLabMembersAttributeOutput> {
    const allMembers = await this.labMemberRepository.findAllByUserId(input.userId);
    let updatedCount = 0;

    for (const member of allMembers) {
      const currentIndex = this.promotionOrder.indexOf(member.attribute);

      // 進級対象の属性であり、かつ最終段階ではない場合
      if (currentIndex !== -1 && currentIndex < this.promotionOrder.length - 1) {
        const nextAttribute = this.promotionOrder[currentIndex + 1];
        member.attribute = nextAttribute;
        await this.labMemberRepository.save(member);
        updatedCount++;
      }
      // D, P, Others の属性を持つメンバーは変更しない
      // promotionOrder に含まれない属性は自動的にスキップされる
    }

    return { updatedCount };
  }
}
