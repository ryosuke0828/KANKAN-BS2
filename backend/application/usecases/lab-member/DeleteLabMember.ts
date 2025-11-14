import { ILabMemberRepository } from '../../../domain/interfaces/ILabMemberRepository.js';

export interface DeleteLabMemberInput {
  id: string;
}

export class DeleteLabMember {
  constructor(private readonly labMemberRepository: ILabMemberRepository) {}

  async execute(input: DeleteLabMemberInput): Promise<void> {
    await this.labMemberRepository.delete(input.id);
  }
}
