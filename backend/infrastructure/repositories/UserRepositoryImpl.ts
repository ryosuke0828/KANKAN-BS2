import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { User } from 'domain/entities/User';
import { IUserRepository } from 'domain/interfaces/IUserRepository';

export class UserRepositoryImpl implements IUserRepository {
  private readonly client: DynamoDBDocumentClient;
  private readonly tableName = process.env.DYNAMODB_TABLE_USERS || 'KANKAN-BS2-Users';

  constructor() {
    const dbClient = new DynamoDBClient({
      region: process.env.AWS_REGION || 'ap-northeast-1',
    });
    this.client = DynamoDBDocumentClient.from(dbClient);
  }

  async findById(id: string): Promise<User | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: { id },
    });
    const { Item } = await this.client.send(command);
    return Item ? (Item as User) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    // 'EmailIndex'というGSIがあることを前提とする
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email,
      },
    });
    const { Items } = await this.client.send(command);
    return Items && Items.length > 0 ? (Items[0] as User) : null;
  }

  async save(user: User): Promise<void> {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: user,
    });
    await this.client.send(command);
  }

  async delete(id: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: { id },
    });
    await this.client.send(command);
  }
}
