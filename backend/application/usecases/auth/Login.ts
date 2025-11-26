import { IUserRepository } from '../../../domain/interfaces/IUserRepository.js';
import { User } from '../../../domain/entities/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

interface LoginInput {
  email: string;
  password: string;
}

interface LoginOutput {
  token: string;
}

export class Login {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute({ email, password }: LoginInput): Promise<LoginOutput> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new Error('Invalid email or password.');
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not set.');
    }

    const token = jwt.sign({ id: user.id, email: user.email }, jwtSecret, {
      expiresIn: '1h',
    });

    return { token };
  }
}
