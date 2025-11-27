import { IUserRepository } from '../../../domain/interfaces/IUserRepository.js';
import { User } from '../../../domain/entities/User.js';
import bcrypt from 'bcrypt';

export interface UpdateUserProfileInput {
  userId: string;
  slackApiToken?: string;
  slackChannelId?: string;
  password?: string;
}

export class UpdateUserProfile {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: UpdateUserProfileInput): Promise<Partial<User>> {
    const user = await this.userRepository.findById(input.userId);

    if (!user) {
      throw new Error('User not found.');
    }

    let updated = false;
    if (input.slackApiToken !== undefined) {
      user.slackApiToken = input.slackApiToken;
      updated = true;
    }
    if (input.slackChannelId !== undefined) {
      user.slackChannelId = input.slackChannelId;
      updated = true;
    }
    if (input.password) {
      user.passwordHash = await bcrypt.hash(input.password, 10);
      updated = true;
    }

    if (updated) {
      await this.userRepository.save(user);
    }

    // Return user without password hash
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
