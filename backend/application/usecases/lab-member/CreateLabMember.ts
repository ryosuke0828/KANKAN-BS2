import { LabMember } from '../../../domain/entities/LabMember.js';
import { ILabMemberRepository } from '../../../domain/interfaces/ILabMemberRepository.js';
import { v4 as uuidv4 } from 'uuid';

export interface CreateLabMemberInput {
  name: string;
  attribute: string; // MemberAttribute 型だが、ここでは string で受け取る
  slackDmId: string;
  userId: string; // リクエストを行ったユーザーのID
}

export class CreateLabMember {
  constructor(private readonly labMemberRepository: ILabMemberRepository) {}

  async execute(input: CreateLabMemberInput): Promise<LabMember> {
    const newLabMember = new LabMember(
      uuidv4(), // 新しいIDを生成
      input.name,
      input.attribute as any, // MemberAttribute にキャスト
      input.slackDmId,
      input.userId,
    );

    await this.labMemberRepository.save(newLabMember);
    return newLabMember;
  }
}
