import { LabMember } from '../../../domain/entities/LabMember.js';
import { ILabMemberRepository } from '../../../domain/interfaces/ILabMemberRepository.js';

export interface UpdateLabMemberInput {
  id: string;
  name?: string;
  attribute?: string; // MemberAttribute 型だが、ここでは string で受け取る
  slackDmId?: string;
  userId?: string;
}

export class UpdateLabMember {
  constructor(private readonly labMemberRepository: ILabMemberRepository) {}

  async execute(input: UpdateLabMemberInput): Promise<LabMember | null> {
    const existingLabMember = await this.labMemberRepository.findById(input.id);

    if (!existingLabMember) {
      return null;
    }

    // 変更があるフィールドのみ更新
    if (input.name !== undefined) {
      existingLabMember.name = input.name;
    }
    if (input.attribute !== undefined) {
      existingLabMember.attribute = input.attribute as any; // MemberAttribute にキャスト
    }
    if (input.slackDmId !== undefined) {
      existingLabMember.slackDmId = input.slackDmId;
    }
    if (input.userId !== undefined) {
      existingLabMember.userId = input.userId;
    }

    await this.labMemberRepository.save(existingLabMember);
    return existingLabMember;
  }
}
