import { Router } from 'express';
import { GetMembersFromSlackReaction } from '../../application/usecases/slack/GetMembersFromSlackReaction.js';
import { IUserRepository } from '../../domain/interfaces/IUserRepository.js';
import { ILabMemberRepository } from '../../domain/interfaces/ILabMemberRepository.js';
import { ISlackRepository } from '../../domain/interfaces/ISlackRepository.js';

export const createMemberRouter = (
  userRepository: IUserRepository,
  labMemberRepository: ILabMemberRepository,
  slackRepository: ISlackRepository,
): Router => {
  const router = Router();

  /**
   * POST /api/v1/members/collect-from-slack
   * Slackのリアクションからメンバー情報を収集するエンドポイント
   */
  router.post('/collect-from-slack', async (req, res) => {
    const { userId, messageTimestamp } = req.body;

    if (!userId || !messageTimestamp) {
      return res.status(400).json({ error: 'userId and messageTimestamp are required.' });
    }

    try {
      const usecase = new GetMembersFromSlackReaction(
        userRepository,
        labMemberRepository,
        slackRepository,
      );

      const members = await usecase.execute({ userId, messageTimestamp });

      res.status(200).json(members);
    } catch (error) {
      console.error('Error in /collect-from-slack:', error);
      if (error instanceof Error) {
        res.status(500).json({ error: 'An unexpected error occurred.', message: error.message, stack: error.stack });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred.', details: JSON.stringify(error) });
      }
    }
  });

  return router;
};

