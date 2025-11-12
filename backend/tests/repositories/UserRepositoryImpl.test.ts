import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { UserRepositoryImpl } from 'infrastructure/repositories/UserRepositoryImpl';
import { createUser } from '../factories/user.factory';

describe('UserRepositoryImpl', () => {
  // This is an integration test and will interact with AWS resources.
  // Ensure AWS credentials and environment variables (KMS_KEY_ID, etc.) are configured.
  
  const region = process.env.AWS_REGION || 'ap-northeast-1';
  const dbClient = new DynamoDBClient({ region });
  const docClient = DynamoDBDocumentClient.from(dbClient);
  const tableName = process.env.DYNAMODB_TABLE_USERS || 'KANKAN-BS2-Users';

  let userRepository: UserRepositoryImpl;
  const usersToCleanup: string[] = [];

  beforeAll(() => {
    userRepository = new UserRepositoryImpl();
  });

  afterAll(async () => {
    // Clean up all created users
    for (const id of usersToCleanup) {
      const command = new DeleteCommand({
        TableName: tableName,
        Key: { id },
      });
      await docClient.send(command);
    }
  });

  it('should encrypt the slackApiToken on save and decrypt it on find', async () => {
    // 1. Create a user with a plaintext token
    const plainTextToken = `xoxp-test-${Date.now()}`;
    const user = createUser({ slackApiToken: plainTextToken });
    usersToCleanup.push(user.id);

    // 2. Save the user (triggers encryption)
    await userRepository.save(user);

    // 3. Fetch directly from DynamoDB to check if the token is encrypted
    const getCommand = new GetCommand({
      TableName: tableName,
      Key: { id: user.id },
    });
    const { Item: rawItem } = await docClient.send(getCommand);

    expect(rawItem).toBeDefined();
    expect(rawItem?.slackApiToken).toBeDefined();
    expect(rawItem?.slackApiToken).not.toBe(plainTextToken);
    expect(rawItem?.slackApiToken.length).toBeGreaterThan(plainTextToken.length);

    // 4. Fetch via the repository (triggers decryption)
    const foundUser = await userRepository.findById(user.id);

    // 5. Assert that the token is decrypted back to the original plaintext
    expect(foundUser).toBeDefined();
    expect(foundUser?.slackApiToken).toBe(plainTextToken);
  }, 30000); // Increase timeout for AWS SDK calls
});
