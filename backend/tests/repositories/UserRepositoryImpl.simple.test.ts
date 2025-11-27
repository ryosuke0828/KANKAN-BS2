import { UserRepositoryImpl } from '../../infrastructure/repositories/UserRepositoryImpl.js';
import { User } from '../../domain/entities/User.js';
import { createUser } from '../factories/user.factory.js';

describe('UserRepositoryImpl', () => {
  let userRepository: UserRepositoryImpl;

  beforeEach(() => {
    userRepository = new UserRepositoryImpl();
    // モックやテスト用のDynamoDBクライアントを設定する場合はここに記述
  });

  it('should save and find a user by ID', async () => {
    const user = createUser();
    await userRepository.save(user);
    const foundUser = await userRepository.findById(user.id);
    expect(foundUser).toEqual(user);
  });

  it('should find a user by email', async () => {
    const user = createUser({ email: 'test@example.com' });
    await userRepository.save(user);
    const foundUser = await userRepository.findByEmail('test@example.com');
    expect(foundUser).toEqual(user);
  });

  it('should return null if user not found by ID', async () => {
    const foundUser = await userRepository.findById('non-existent-id');
    expect(foundUser).toBeNull();
  });

  it('should return null if user not found by email', async () => {
    const foundUser = await userRepository.findByEmail('non-existent@example.com');
    expect(foundUser).toBeNull();
  });

  it('should delete a user', async () => {
    const user = createUser();
    await userRepository.save(user);
    await userRepository.delete(user.id);
    const foundUser = await userRepository.findById(user.id);
    expect(foundUser).toBeNull();
  });
});