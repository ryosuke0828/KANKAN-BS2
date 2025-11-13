import assert from 'assert';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { KMSClient, EncryptCommand, DecryptCommand } from '@aws-sdk/client-kms';
import { UserRepositoryImpl } from '../../infrastructure/repositories/UserRepositoryImpl.js'; // .js を追加
import { createUser } from '../factories/user.factory.js'; // .js を追加
import { User } from '../../domain/entities/User.js'; // .js を追加

// AWS SDK クライアントのモック
// ここでは、jest.mock の代わりに手動でモックを作成します。
const mockDynamoDBDocumentClientSend = async (command: any) => { // 型アサーション
  if (command instanceof GetCommand) {
    if (command.input.Key?.id === 'user-with-encrypted-token') {
      return { Item: { id: 'user-with-encrypted-token', slackApiToken: Buffer.from('encrypted-token').toString('base64') } };
    }
    if (command.input.Key?.id === 'user-without-token') {
      return { Item: { id: 'user-without-token' } };
    }
    return { Item: undefined };
  }
  if (command instanceof PutCommand) {
    return {};
  }
  if (command instanceof QueryCommand) {
    if (command.input.ExpressionAttributeValues?.[':email'] === 'test@example.com') {
      return { Items: [{ id: 'user-with-encrypted-token', email: 'test@example.com', slackApiToken: Buffer.from('encrypted-token').toString('base64') }] };
    }
    return { Items: [] };
  }
  throw new Error('Unexpected DynamoDB command');
};

const mockKMSClientSend = async (command: any) => { // 型アサーション
  if (command instanceof EncryptCommand) {
    return { CiphertextBlob: Buffer.from('encrypted-token') };
  }
  if (command instanceof DecryptCommand) {
    return { Plaintext: new TextEncoder().encode('xoxp-test-plaintext-token') };
  }
  throw new Error('Unexpected KMS command');
};

// テスト関数
async function runTests() {
  console.log('Running UserRepositoryImpl simple tests...');

  // テストケース1: should encrypt slackApiToken when saving a user
  try {
    console.log('  Test 1: should encrypt slackApiToken when saving a user');
    const plainTextToken = 'xoxp-test-plaintext-token';
    const encryptedTokenBase64 = Buffer.from('encrypted-token').toString('base64');
    const user = createUser({ id: 'user-to-save', slackApiToken: plainTextToken });

    // モックのセットアップ
    const originalDocClientFrom = DynamoDBDocumentClient.from;
    const originalKMSClient = KMSClient;
    const originalKMSClientSend = KMSClient.prototype.send; // 元の send メソッドを保存

    // 呼び出し検証用のスパイ
    const ddbSentCommands: any[] = [];
    const kmsSentCommands: any[] = [];

    (DynamoDBDocumentClient.from as any) = () => ({
      send: async (command: any) => {
        ddbSentCommands.push(command);
        return mockDynamoDBDocumentClientSend(command);
      },
    });
    KMSClient.prototype.send = (async (command: any) => {
      kmsSentCommands.push(command);
      return mockKMSClientSend(command);
    }) as any; // KMSClient の send メソッドをモック

    process.env.KMS_KEY_ID = 'test-kms-key-id';
    process.env.DYNAMODB_TABLE_USERS = 'test-users-table';

    const userRepository = new UserRepositoryImpl();
    await userRepository.save(user);

    // 期待: PutCommand が1回呼ばれ、Item の slackApiToken は平文ではなく Base64 暗号文字列
    const putCommands = ddbSentCommands.filter((c) => c instanceof PutCommand);
    assert.strictEqual(putCommands.length, 1, 'Test 1: PutCommand should be called once');
    const putItem = (putCommands[0] as any).input.Item;
    assert.ok(putItem, 'Test 1: PutCommand should contain Item');
    assert.notStrictEqual(
      putItem.slackApiToken,
      plainTextToken,
      'Test 1: Token should not be plaintext when saving'
    );
    assert.strictEqual(
      putItem.slackApiToken,
      encryptedTokenBase64,
      'Test 1: Token should be saved as base64-encoded ciphertext'
    );

    // 期待: KMS の Encrypt が1回呼ばれている
    const encryptCalls = kmsSentCommands.filter((c) => c instanceof EncryptCommand);
    assert.strictEqual(encryptCalls.length, 1, 'Test 1: Encrypt should be called once');

    console.log('    Test 1 passed.');

    // モックのリセット
    DynamoDBDocumentClient.from = originalDocClientFrom;
    KMSClient.prototype.send = originalKMSClientSend; // 元の send メソッドに戻す
    delete process.env.KMS_KEY_ID;
    delete process.env.DYNAMODB_TABLE_USERS;

  } catch (error: any) { // 型アサーション
    console.error('  Test 1 failed:', error.message);
    process.exit(1);
  }

  // テストケース2: should decrypt slackApiToken when finding a user by id
  try {
    console.log('  Test 2: should decrypt slackApiToken when finding a user by id');
    const plainTextToken = 'xoxp-test-plaintext-token';
    const user = createUser({ id: 'user-with-encrypted-token', slackApiToken: plainTextToken });

    // モックのセットアップ
    const originalDocClientFrom = DynamoDBDocumentClient.from;
    const originalKMSClient = KMSClient;
    const originalKMSClientSend = KMSClient.prototype.send;

    // 呼び出し検証用のスパイ
    const ddbSentCommands: any[] = [];
    const kmsSentCommands: any[] = [];
    (DynamoDBDocumentClient.from as any) = () => ({
      send: async (command: any) => {
        ddbSentCommands.push(command);
        return mockDynamoDBDocumentClientSend(command);
      },
    });
    KMSClient.prototype.send = (async (command: any) => {
      kmsSentCommands.push(command);
      return mockKMSClientSend(command);
    }) as any;

    process.env.KMS_KEY_ID = 'test-kms-key-id';
    process.env.DYNAMODB_TABLE_USERS = 'test-users-table';

    const userRepository = new UserRepositoryImpl();
    const foundUser = await userRepository.findById(user.id);

    assert.strictEqual(foundUser?.slackApiToken, plainTextToken, 'Test 2: Decrypted token should match plaintext');
    // 期待: Decrypt が1回呼ばれている、Encryptは呼ばれない
    const decryptCalls = kmsSentCommands.filter((c) => c instanceof DecryptCommand);
    const encryptCalls = kmsSentCommands.filter((c) => c instanceof EncryptCommand);
    assert.strictEqual(decryptCalls.length, 1, 'Test 2: Decrypt should be called once');
    assert.strictEqual(encryptCalls.length, 0, 'Test 2: Encrypt should not be called during find');
    console.log('    Test 2 passed.');

    // モックのリセット
    DynamoDBDocumentClient.from = originalDocClientFrom;
    KMSClient.prototype.send = originalKMSClientSend;
    delete process.env.KMS_KEY_ID;
    delete process.env.DYNAMODB_TABLE_USERS;

  } catch (error: any) {
    console.error('  Test 2 failed:', error.message);
    process.exit(1);
  }

  // テストケース3: should decrypt slackApiToken when finding a user by email
  try {
    console.log('  Test 3: should decrypt slackApiToken when finding a user by email');
    const plainTextToken = 'xoxp-test-plaintext-token';
    const user = createUser({ id: 'user-with-encrypted-token', email: 'test@example.com', slackApiToken: plainTextToken });

    // モックのセットアップ
    const originalDocClientFrom = DynamoDBDocumentClient.from;
    const originalKMSClient = KMSClient;
    const originalKMSClientSend = KMSClient.prototype.send;

    // 呼び出し検証用のスパイ
    const ddbSentCommands: any[] = [];
    const kmsSentCommands: any[] = [];
    (DynamoDBDocumentClient.from as any) = () => ({
      send: async (command: any) => {
        ddbSentCommands.push(command);
        return mockDynamoDBDocumentClientSend(command);
      },
    });
    KMSClient.prototype.send = (async (command: any) => {
      kmsSentCommands.push(command);
      return mockKMSClientSend(command);
    }) as any;

    process.env.KMS_KEY_ID = 'test-kms-key-id';
    process.env.DYNAMODB_TABLE_USERS = 'test-users-table';

    const userRepository = new UserRepositoryImpl();
    const foundUser = await userRepository.findByEmail(user.email);

    assert.strictEqual(foundUser?.slackApiToken, plainTextToken, 'Test 3: Decrypted token should match plaintext');
    // 期待: Decrypt が1回呼ばれている、Encryptは呼ばれない
    const decryptCalls = kmsSentCommands.filter((c) => c instanceof DecryptCommand);
    const encryptCalls = kmsSentCommands.filter((c) => c instanceof EncryptCommand);
    assert.strictEqual(decryptCalls.length, 1, 'Test 3: Decrypt should be called once');
    assert.strictEqual(encryptCalls.length, 0, 'Test 3: Encrypt should not be called during find');
    console.log('    Test 3 passed.');

    // モックのリセット
    DynamoDBDocumentClient.from = originalDocClientFrom;
    KMSClient.prototype.send = originalKMSClientSend;
    delete process.env.KMS_KEY_ID;
    delete process.env.DYNAMODB_TABLE_USERS;

  } catch (error: any) {
    console.error('  Test 3 failed:', error.message);
    process.exit(1);
  }

  // テストケース4: should not attempt to decrypt if slackApiToken is not present
  try {
    console.log('  Test 4: should not attempt to decrypt if slackApiToken is not present');
    const user = createUser({ id: 'user-without-token', slackApiToken: undefined });

    // モックのセットアップ
    const originalDocClientFrom = DynamoDBDocumentClient.from;
    const originalKMSClient = KMSClient;
    const originalKMSClientSend = KMSClient.prototype.send;

    // 呼び出し検証用のスパイ
    const ddbSentCommands: any[] = [];
    let decryptCalled = false;
    (DynamoDBDocumentClient.from as any) = () => ({
      send: async (command: any) => {
        ddbSentCommands.push(command);
        return mockDynamoDBDocumentClientSend(command);
      },
    });
    KMSClient.prototype.send = (async (command: any) => {
      if (command instanceof DecryptCommand) decryptCalled = true;
      return mockKMSClientSend(command);
    }) as any;

    process.env.KMS_KEY_ID = 'test-kms-key-id';
    process.env.DYNAMODB_TABLE_USERS = 'test-users-table';

    const userRepository = new UserRepositoryImpl();
    const foundUser = await userRepository.findById(user.id);

    assert.strictEqual(foundUser?.slackApiToken, undefined, 'Test 4: Token should be undefined');
    assert.strictEqual(decryptCalled, false, 'Test 4: Decrypt should not be called when token is absent');
    console.log('    Test 4 passed.');

    // モックのリセット
    DynamoDBDocumentClient.from = originalDocClientFrom;
    KMSClient.prototype.send = originalKMSClientSend;
    delete process.env.KMS_KEY_ID;
    delete process.env.DYNAMODB_TABLE_USERS;

  } catch (error: any) {
    console.error('  Test 4 failed:', error.message);
    process.exit(1);
  }

  // テストケース5: should throw an error if KMS_KEY_ID is not set
  try {
    console.log('  Test 5: should throw an error if KMS_KEY_ID is not set');
    // モックのセットアップ
    const originalDocClientFrom = DynamoDBDocumentClient.from;
    const originalKMSClient = KMSClient;
    const originalKMSClientSend = KMSClient.prototype.send;

    (DynamoDBDocumentClient.from as any) = () => ({ send: mockDynamoDBDocumentClientSend });
    KMSClient.prototype.send = mockKMSClientSend;

    delete process.env.KMS_KEY_ID; // KMS_KEY_ID を削除
    process.env.DYNAMODB_TABLE_USERS = 'test-users-table';

    let thrownError: any; // 型アサーション
    try {
      new UserRepositoryImpl();
    } catch (error: any) { // 型アサーション
      thrownError = error;
    }
    assert.strictEqual(thrownError?.message, 'KMS_KEY_ID environment variable is not set.', 'Test 5: Should throw KMS_KEY_ID error');
    console.log('    Test 5 passed.');

    // モックのリセット
    DynamoDBDocumentClient.from = originalDocClientFrom;
    KMSClient.prototype.send = originalKMSClientSend;
    delete process.env.KMS_KEY_ID;
    delete process.env.DYNAMODB_TABLE_USERS;

  } catch (error: any) {
    console.error('  Test 5 failed:', error.message);
    process.exit(1);
  }


  console.log('All simple tests passed!');
}

runTests();
