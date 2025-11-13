import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  KMSClient,
  EncryptCommand,
  DecryptCommand,
} from '@aws-sdk/client-kms';
import { User } from '../../domain/entities/User.js';
import { IUserRepository } from '../../domain/interfaces/IUserRepository.js';

export class UserRepositoryImpl implements IUserRepository {
  private readonly docClient: DynamoDBDocumentClient;
  private readonly kmsClient: KMSClient;
  private readonly tableName = process.env.DYNAMODB_TABLE_USERS || 'KANKAN-BS2-Users';
  private readonly kmsKeyId = process.env.KMS_KEY_ID;

  constructor() {
    const region = process.env.AWS_REGION || 'ap-northeast-1';
    const dbClient = new DynamoDBClient({ region });
    this.docClient = DynamoDBDocumentClient.from(dbClient);
    this.kmsClient = new KMSClient({ region });

    if (!this.kmsKeyId) {
      throw new Error('KMS_KEY_ID environment variable is not set.');
    }
  }

  private async encrypt(text: string): Promise<string> {
    const command = new EncryptCommand({
      KeyId: this.kmsKeyId,
      Plaintext: new TextEncoder().encode(text),
    });
    const { CiphertextBlob } = await this.kmsClient.send(command);
    if (!CiphertextBlob) {
      throw new Error('KMS encryption failed.');
    }
    // DynamoDBに保存するためにBase64文字列に変換
    return Buffer.from(CiphertextBlob).toString('base64');
  }

  private async decrypt(encryptedBase64: string): Promise<string> {
    // Base64文字列からUint8Arrayに戻す
    const ciphertextBlob = Buffer.from(encryptedBase64, 'base64');
    const command = new DecryptCommand({
      KeyId: this.kmsKeyId,
      CiphertextBlob: ciphertextBlob,
    });
    const { Plaintext } = await this.kmsClient.send(command);
    if (!Plaintext) {
      throw new Error('KMS decryption failed.');
    }
    return new TextDecoder().decode(Plaintext);
  }

  async findById(id: string): Promise<User | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: { id },
    });
    const { Item } = await this.docClient.send(command);

    if (!Item) return null;

    if (Item.slackApiToken) {
      Item.slackApiToken = await this.decrypt(Item.slackApiToken);
    }

    return Item as User;
  }

  async findByEmail(email: string): Promise<User | null> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email,
      },
    });
    const { Items } = await this.docClient.send(command);
    
    if (!Items || Items.length === 0) return null;

    const item = Items[0];
    if (item.slackApiToken) {
      item.slackApiToken = await this.decrypt(item.slackApiToken);
    }

    return item as User;
  }

  async save(user: User): Promise<void> {
    const itemToSave = { ...user };

    if (itemToSave.slackApiToken) {
      itemToSave.slackApiToken = await this.encrypt(itemToSave.slackApiToken);
    }

    const command = new PutCommand({
      TableName: this.tableName,
      Item: itemToSave,
    });
    await this.docClient.send(command);
  }

  async delete(id: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: { id },
    });
    await this.docClient.send(command);
  }
}
