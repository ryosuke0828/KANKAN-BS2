import assert from 'assert';
import request from 'supertest';
import { createLabMemberRouter } from '../../presentation/routes/labMemberRoutes.js';
import { createTestServer } from '../helpers/createTestServer.js';
import { ILabMemberRepository } from '../../domain/interfaces/ILabMemberRepository.js';
import { LabMember } from '../../domain/entities/LabMember.js';
import { MemberAttribute } from '../../domain/types/MemberAttribute.js';

// 1. ILabMemberRepository のモックを作成
const mockLabMemberRepository: ILabMemberRepository = {
  save: async (member: LabMember): Promise<void> => {
    // 何も返さない
    return;
  },
  findById: async (id: string): Promise<LabMember | null> => null, // 今回は使わない
  findAllByUserId: async (userId: string): Promise<LabMember[]> => [], // 今回は使わない
  delete: async (id: string): Promise<void> => {}, // 今回は使わない
  findBySlackDmId: async (slackDmId: string): Promise<LabMember | null> => null, // 今回は使わない
};

// 2. テストサーバーをセットアップ
const labMemberRouter = createLabMemberRouter(mockLabMemberRepository);
const app = createTestServer(labMemberRouter, '/api/v1/lab-members');

// 3. テストケースを記述
async function runTests() {
  console.log('Running labMemberRoutes tests...');

  // 成功ケース
  console.log('  Test Case: should create a lab member and return 201');
  const newMemberData = {
    name: 'Test User',
    attribute: 'B4',
    slackDmId: 'U12345',
    userId: 'user-test-id',
  };

  const response = await request(app)
    .post('/api/v1/lab-members')
    .send(newMemberData);

  assert.strictEqual(response.status, 201, 'Test Case 1 Failed: Status code should be 201');
  assert.strictEqual(response.body.name, newMemberData.name, 'Test Case 1 Failed: Name should match');
  assert.ok(response.body.id, 'Test Case 1 Failed: ID should be present');
  console.log('    Test Case 1 Passed.');


  // 失敗ケース：必須パラメータ不足
  console.log('  Test Case: should return 400 if required fields are missing');
  const incompleteData = {
    name: 'Test User',
  };

  const response2 = await request(app)
    .post('/api/v1/lab-members')
    .send(incompleteData);

  assert.strictEqual(response2.status, 400, 'Test Case 2 Failed: Status code should be 400');
  console.log('    Test Case 2 Passed.');

  console.log('All labMemberRoutes tests passed!');
}

runTests().catch(error => {
  console.error('An unexpected error occurred during test execution:', error);
  process.exit(1);
});
