export class User {
  constructor(
    public readonly id: string,
    public email: string,
    public passwordHash: string, // パスワードはハッシュ化して保存
    public slackApiToken: string,
    public slackChannelId: string,
  ) {}
}
