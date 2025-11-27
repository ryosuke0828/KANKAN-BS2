import { Router, Request, Response } from 'express';
import { UpdateUserProfile } from '../../application/usecases/user/UpdateUserProfile.js';
import { UserRepositoryImpl } from '../../infrastructure/repositories/UserRepositoryImpl.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Protect all routes in this file
router.use(authMiddleware);

router.put('/me', async (req: Request, res: Response) => {
  // The user ID is retrieved from the decoded JWT payload, set by the authMiddleware
  const userId = (req.user as any)?.id;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: User ID not found in token.' });
  }

  const { slackApiToken, slackChannelId, password } = req.body;

  try {
    const userRepository = new UserRepositoryImpl();
    const updateUserProfile = new UpdateUserProfile(userRepository);
    const updatedUser = await updateUserProfile.execute({
      userId,
      slackApiToken,
      slackChannelId,
      password,
    });

    res.status(200).json(updatedUser);
  } catch (error: any) {
    if (error.message === 'User not found.') {
      return res.status(404).json({ message: error.message });
    }
    console.error('Update Profile Error:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
});

export default router;