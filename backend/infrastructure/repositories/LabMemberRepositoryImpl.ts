import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { LabMember } from '../../domain/entities/LabMember.js';
import { ILabMemberRepository } from '../../domain/interfaces/ILabMemberRepository.js';

export class LabMemberRepositoryImpl implements ILabMemberRepository {
  private readonly client: DynamoDBDocumentClient;
  private readonly tableName = process.env.DYNAMODB_TABLE_MEMBERS || 'KANKAN-BS2-LabMembers';

  constructor() {
    const dbClient = new DynamoDBClient({
      region: process.env.AWS_REGION || 'ap-northeast-1',
    });
    this.client = DynamoDBDocumentClient.from(dbClient);
  }

  async findById(id: string): Promise<LabMember | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: { id },
    });
    const { Item } = await this.client.send(command);
    return Item ? (Item as LabMember) : null;
  }

  async findBySlackDmId(slackDmId: string): Promise<LabMember | null> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'SlackDmIdIndex',
      KeyConditionExpression: 'slackDmId = :slackDmId',
      ExpressionAttributeValues: {
        ':slackDmId': slackDmId,
      },
    });
    const { Items } = await this.client.send(command);
    return Items && Items.length > 0 ? (Items[0] as LabMember) : null;
  }

  async findAllByUserId(userId: string): Promise<LabMember[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    });
    const { Items } = await this.client.send(command);
    return Items ? (Items as LabMember[]) : [];
  }

  async save(labMember: LabMember): Promise<void> {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: labMember,
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
