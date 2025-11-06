import { MemberAttribute } from '../types/MemberAttribute';

export class LabMember {
  constructor(
    public readonly id: string,
    public name: string,
    public attribute: MemberAttribute,
    public slackDmId: string,
    public userId: string, // どのUserに紐づくか
  ) {}
}
