import { IUserRepository } from '../../../domain/interfaces/IUserRepository.js';
import { User } from '../../../domain/entities/User.js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

interface RegisterUserInput {
  email: string;
  password: string;
}

export class RegisterUser {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute({ email, password }: RegisterUserInput): Promise<User> {
    // Basic validation
    if (!email || !password) {
      throw new Error('Email and password are required.');
    }
    // More specific validations can be added here (e.g., password strength)

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('Email already in use.');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = new User(
      uuidv4(),
      email,
      passwordHash,
      '', // slackApiToken is empty initially
      ''  // slackChannelId is empty initially
    );

    await this.userRepository.save(newUser);

    // Return user without password hash
    const { passwordHash: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword as User;
  }
}
