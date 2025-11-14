import { IUserRepository } from '../../../domain/interfaces/IUserRepository.js';
import { ILabMemberRepository } from '../../../domain/interfaces/ILabMemberRepository.js';
import { ISlackRepository } from '../../../domain/interfaces/ISlackRepository.js';
import { LabMember } from '../../../domain/entities/LabMember.js';

// ユースケースの入力データ型
export interface GetMembersFromSlackReactionInput {
  userId: string;
  messageTimestamp: string;
}

// ユースケースの出力データ型
export type GetMembersFromSlackReactionOutput = LabMember[];

export class GetMembersFromSlackReaction {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly labMemberRepository: ILabMemberRepository,
    private readonly slackRepository: ISlackRepository,
  ) {}

  async execute(
    input: GetMembersFromSlackReactionInput,
  ): Promise<GetMembersFromSlackReactionOutput> {
    // 1. ユーザー情報を取得
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new Error('User not found.');
    }

    // 2. SlackからリアクションしたユーザーのIDリストを取得
    const slackUserIds = await this.slackRepository.fetchReactionUserIds(
      user.slackApiToken,
      user.slackChannelId,
      input.messageTimestamp,
    );

    // 3. Slack IDを元にラボメンバー情報を並行して取得
    const members = await Promise.all(
      slackUserIds.map(slackId =>
        this.labMemberRepository.findBySlackDmId(slackId),
      ),
    );

    // 4. 存在しないメンバー(null)を除外して返す
    return members.filter((member): member is LabMember => member !== null);
  }
}
