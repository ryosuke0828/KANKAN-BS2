import { Router } from 'express';
import { GetMembersFromSlackReaction } from '../../application/usecases/slack/GetMembersFromSlackReaction.js';
import { LabMemberRepositoryImpl } from '../../infrastructure/repositories/LabMemberRepositoryImpl.js';
import { UserRepositoryImpl } from '../../infrastructure/repositories/UserRepositoryImpl.js';
import { SlackRepositoryImpl } from '../../infrastructure/external/SlackRepositoryImpl.js';

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
    // 環境変数をログに出力（デバッグ用）
    console.log('DYNAMODB_TABLE_USERS:', process.env.DYNAMODB_TABLE_USERS);
    console.log('DYNAMODB_TABLE_MEMBERS:', process.env.DYNAMODB_TABLE_MEMBERS);

    // DIコンテナがないため、手動で依存性を注入（インスタンス化）する
    const userRepository = new UserRepositoryImpl();
    const labMemberRepository = new LabMemberRepositoryImpl();
    const slackRepository = new SlackRepositoryImpl();

    const usecase = new GetMembersFromSlackReaction(
      userRepository,
      labMemberRepository,
      slackRepository
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

export default router;
