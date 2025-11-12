import { User } from 'domain/entities/User';
import { v4 as uuidv4 } from 'uuid';

export const createUser = (overrides: Partial<User> = {}): User => {
  return new User(
    overrides.id || uuidv4(),
    overrides.email || 'test@example.com',
    overrides.passwordHash || 'hashed_password',
    overrides.slackApiToken || 'xoxp-test-token',
    overrides.slackChannelId || 'C12345678',
  );
};
