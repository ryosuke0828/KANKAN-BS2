import { Router, Request, Response } from 'express';
import { Login } from '../../application/usecases/auth/Login.js';
import { RegisterUser } from '../../application/usecases/auth/RegisterUser.js';
import { UserRepositoryImpl } from '../../infrastructure/repositories/UserRepositoryImpl.js';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const userRepository = new UserRepositoryImpl();
    const loginUseCase = new Login(userRepository);
    const { token } = await loginUseCase.execute({ email, password });

    res.status(200).json({ token });
  } catch (error: any) {
    if (error.message === 'Invalid email or password.') {
      return res.status(401).json({ message: error.message });
    }
    console.error('Login Error:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
});

router.post('/register', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const userRepository = new UserRepositoryImpl();
    const registerUserUseCase = new RegisterUser(userRepository);
    const user = await registerUserUseCase.execute({ email, password });

    res.status(201).json(user);
  } catch (error: any) {
    if (error.message === 'Email already in use.') {
      return res.status(409).json({ message: error.message });
    }
    if (error.message === 'Email and password are required.') {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    console.error('Registration Error:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
});

export default router;
