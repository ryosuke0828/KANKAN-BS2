import { LabMember } from '../../../domain/entities/LabMember.js';
import { ILabMemberRepository } from '../../../domain/interfaces/ILabMemberRepository.js';

interface ListLabMembersInput {
  userId: string;
}

export class ListLabMembers {
  constructor(private readonly labMemberRepository: ILabMemberRepository) {}

  async execute({ userId }: ListLabMembersInput): Promise<LabMember[]> {
    if (!userId) {
      throw new Error('User ID is required.');
    }
    return this.labMemberRepository.findAllByUserId(userId);
  }
}
