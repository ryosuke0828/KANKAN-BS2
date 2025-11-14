import { IUserRepository } from '../../../domain/interfaces/IUserRepository.js';
import { ILabMemberRepository } from '../../../domain/interfaces/ILabMemberRepository.js';
import { ISlackRepository } from '../../../domain/interfaces/ISlackRepository.js';

// ユースケースの入力データ型
export interface PaymentRequest {
  memberId: string;
  amount: number;
}

export interface SendPaymentRequestDmInput {
  userId: string;
  paymentRequests: PaymentRequest[];
  paymentUrl: string;
}

export class SendPaymentRequestDm {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly labMemberRepository: ILabMemberRepository,
    private readonly slackRepository: ISlackRepository,
  ) {}

  async execute(input: SendPaymentRequestDmInput): Promise<void> {
    const { userId, paymentRequests, paymentUrl } = input;

    // 1. ユーザー情報を取得してAPIトークンを得る
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }
    const token = user.slackApiToken;

    // 2. 各メンバーへのDM送信処理をプロミスの配列として作成
    const sendDmPromises = paymentRequests.map(async request => {
      // 3. メンバー情報を取得してDM IDを得る
      const member = await this.labMemberRepository.findById(request.memberId);
      if (!member) {
        // メンバーが見つからない場合はスキップ（またはエラーログを出力）
        console.warn(`LabMember with ID ${request.memberId} not found. Skipping DM.`);
        return;
      }

      // 4. メッセージを生成
      const message = `${request.amount}円を支払ってください。\n支払いリンク: ${paymentUrl}`;

      // 5. DMを送信
      await this.slackRepository.sendDirectMessage(
        token,
        member.slackDmId,
        message,
      );
    });

    // 6. すべてのDM送信を並行して実行
    await Promise.all(sendDmPromises);
  }
}
