export interface ISlackRepository {
  fetchReactionUserIds(
    token: string,
    channelId: string,
    messageTimestamp: string,
  ): Promise<string[]>;

  sendDirectMessage(
    token: string,
    slackDmId: string,
    message: string,
  ): Promise<void>;
}
