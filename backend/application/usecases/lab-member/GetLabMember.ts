import { LabMember } from '../../../domain/entities/LabMember.js';
import { ILabMemberRepository } from '../../../domain/interfaces/ILabMemberRepository.js';

export interface GetLabMemberInput {
  id: string;
}

export class GetLabMember {
  constructor(private readonly labMemberRepository: ILabMemberRepository) {}

  async execute(input: GetLabMemberInput): Promise<LabMember | null> {
    return this.labMemberRepository.findById(input.id);
  }
}
