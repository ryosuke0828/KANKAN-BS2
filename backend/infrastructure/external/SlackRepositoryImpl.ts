import { WebClient } from '@slack/web-api';
import { ISlackRepository } from 'domain/interfaces/ISlackRepository';

export class SlackRepositoryImpl implements ISlackRepository {
  private readonly client: WebClient;

  constructor() {
    // インスタンス化の際に新しいWebClientを作成します。
    // トークンはメソッド実行時に引数で受け取るため、ここでは不要です。
    this.client = new WebClient();
  }

  async fetchReactionUserIds(
    token: string,
    channelId: string,
    messageTimestamp: string,
  ): Promise<string[]> {
    try {
      const response = await this.client.reactions.get({
        token: token,
        channel: channelId,
        timestamp: messageTimestamp,
      });

      if (!response.ok || response.type !== 'message' || !response.message) {
        throw new Error('Failed to fetch reactions from Slack.');
      }

      // すべてのリアクションからユーザーIDを重複なく収集する
      const userIds = new Set<string>();
      if (response.message.reactions) {
        for (const reaction of response.message.reactions) {
          if (reaction.users) {
            reaction.users.forEach(userId => userIds.add(userId));
          }
        }
      }

      return Array.from(userIds);
    } catch (error) {
      console.error('Error fetching reactions from Slack:', error);
      throw error;
    }
  }

  async sendDirectMessage(
    token: string,
    slackDmId: string,
    message: string,
  ): Promise<void> {
    try {
      await this.client.chat.postMessage({
        token: token,
        channel: slackDmId,
        text: message,
      });
    } catch (error) {
      console.error(`Error sending DM to ${slackDmId}:`, error);
      throw error;
    }
  }
}
