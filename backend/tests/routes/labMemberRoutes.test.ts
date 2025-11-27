import request from 'supertest';
import { createLabMemberRouter } from '../../presentation/routes/labMemberRoutes.js';
import { createTestServer } from '../helpers/createTestServer.js';
import { LabMemberRepositoryImpl } from '../../infrastructure/repositories/LabMemberRepositoryImpl.js';
import { LabMember } from '../../domain/entities/LabMember.js';
import { ILabMemberRepository } from '../../domain/interfaces/ILabMemberRepository.js';

// モックのリポジトリ実装
class MockLabMemberRepository implements ILabMemberRepository {
  private members: LabMember[] = [];

  async findById(id: string): Promise<LabMember | null> {
    return this.members.find(m => m.id === id) || null;
  }

  async findBySlackDmId(slackDmId: string): Promise<LabMember | null> {
    return this.members.find(m => m.slackDmId === slackDmId) || null;
  }

  async findAllByUserId(userId: string): Promise<LabMember[]> {
    return this.members.filter(m => m.userId === userId);
  }

  async save(labMember: LabMember): Promise<void> {
    const index = this.members.findIndex(m => m.id === labMember.id);
    if (index > -1) {
      this.members[index] = labMember;
    } else {
      this.members.push(labMember);
    }
  }

  async delete(id: string): Promise<void> {
    this.members = this.members.filter(m => m.id !== id);
  }
}

describe('labMemberRoutes', () => {
  let mockLabMemberRepository: MockLabMemberRepository;
  let app: any; // Express app

  beforeEach(() => {
    mockLabMemberRepository = new MockLabMemberRepository();
    const labMemberRouter = createLabMemberRouter(mockLabMemberRepository);
    app = createTestServer(labMemberRouter, '/api/v1/lab-members');
  });

  // テストケース
  it('should create a new lab member', async () => {
    const newMember = {
      name: 'Test Member',
      attribute: 'B3',
      slackDmId: 'U1234567890',
      userId: 'user123',
    };

    const res = await request(app)
      .post('/api/v1/lab-members')
      .send(newMember)
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe(newMember.name);
  });

  it('should get a lab member by ID', async () => {
    const member = new LabMember('member1', 'Existing Member', 'M1', 'U0987654321', 'user123');
    await mockLabMemberRepository.save(member);

    const res = await request(app)
      .get(`/api/v1/lab-members/${member.id}`)
      .expect(200);

    expect(res.body.id).toBe(member.id);
    expect(res.body.name).toBe(member.name);
  });

  it('should return 404 if lab member not found', async () => {
    await request(app)
      .get('/api/v1/lab-members/nonexistent')
      .expect(404);
  });

  it('should update a lab member', async () => {
    const member = new LabMember('member1', 'Existing Member', 'M1', 'U0987654321', 'user123');
    await mockLabMemberRepository.save(member);

    const updatedData = {
      name: 'Updated Member Name',
      attribute: 'M2',
    };

    const res = await request(app)
      .put(`/api/v1/lab-members/${member.id}`)
      .send(updatedData)
      .expect(200);

    expect(res.body.name).toBe(updatedData.name);
    expect(res.body.attribute).toBe(updatedData.attribute);
  });

  it('should delete a lab member', async () => {
    const member = new LabMember('member1', 'Existing Member', 'M1', 'U0987654321', 'user123');
    await mockLabMemberRepository.save(member);

    await request(app)
      .delete(`/api/v1/lab-members/${member.id}`)
      .expect(204);

    const found = await mockLabMemberRepository.findById(member.id);
    expect(found).toBeNull();
  });
});