import { LabMember } from '../entities/LabMember';

export interface ILabMemberRepository {
  findById(id: string): Promise<LabMember | null>;
  findBySlackDmId(slackDmId: string): Promise<LabMember | null>;
  findAllByUserId(userId: string): Promise<LabMember[]>;
  save(labMember: LabMember): Promise<void>;
  delete(id: string): Promise<void>;
}
