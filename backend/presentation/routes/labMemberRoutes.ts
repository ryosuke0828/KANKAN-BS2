import { Router } from 'express';
import { CreateLabMember } from '../../application/usecases/lab-member/CreateLabMember.js';
import { GetLabMember } from '../../application/usecases/lab-member/GetLabMember.js';
import { UpdateLabMember } from '../../application/usecases/lab-member/UpdateLabMember.js';
import { DeleteLabMember } from '../../application/usecases/lab-member/DeleteLabMember.js';
import { BulkUpdateLabMembersAttribute } from '../../application/usecases/lab-member/BulkUpdateLabMembersAttribute.js';
import { ILabMemberRepository } from '../../domain/interfaces/ILabMemberRepository.js';

export const createLabMemberRouter = (labMemberRepository: ILabMemberRepository): Router => {
  const router = Router();

  /**
   * POST /api/v1/lab-members
   * Labメンバーを作成するエンドポイント
   */
  router.post('/', async (req, res) => {
    const { name, attribute, slackDmId, userId } = req.body; // userId はリクエストを行ったユーザーのIDを使用

    if (!name || !attribute || !slackDmId || !userId) {
      return res.status(400).json({ error: 'name, attribute, slackDmId, and userId are required.' });
    }

    try {
      const usecase = new CreateLabMember(labMemberRepository);
      const newLabMember = await usecase.execute({ name, attribute, slackDmId, userId });
      res.status(201).json(newLabMember);
    } catch (error) {
      console.error('Error in POST /lab-members:', error);
      if (error instanceof Error) {
          res.status(500).json({ error: 'An unexpected error occurred.', message: error.message, stack: error.stack });
      } else {
          res.status(500).json({ error: 'An unexpected error occurred.', details: JSON.stringify(error) });
      }
    }
  });

  /**
   * GET /api/v1/lab-members/:id
   * Labメンバーを取得するエンドポイント
   */
  router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
      const usecase = new GetLabMember(labMemberRepository);
      const labMember = await usecase.execute({ id });

      if (!labMember) {
        return res.status(404).json({ error: 'LabMember not found.' });
      }
      res.status(200).json(labMember);
    } catch (error) {
      console.error('Error in GET /lab-members/:id:', error);
      if (error instanceof Error) {
          res.status(500).json({ error: 'An unexpected error occurred.', message: error.message, stack: error.stack });
      } else {
          res.status(500).json({ error: 'An unexpected error occurred.', details: JSON.stringify(error) });
      }
    }
  });

  /**
   * PUT /api/v1/lab-members/:id
   * Labメンバーを更新するエンドポイント
   */
  router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, attribute, slackDmId, userId } = req.body;

    try {
      const usecase = new UpdateLabMember(labMemberRepository);
      const updatedLabMember = await usecase.execute({ id, name, attribute, slackDmId, userId });

      if (!updatedLabMember) {
        return res.status(404).json({ error: 'LabMember not found.' });
      }
      res.status(200).json(updatedLabMember);
    } catch (error) {
      console.error('Error in PUT /lab-members/:id:', error);
      if (error instanceof Error) {
          res.status(500).json({ error: 'An unexpected error occurred.', message: error.message, stack: error.stack });
      } else {
          res.status(500).json({ error: 'An unexpected error occurred.', details: JSON.stringify(error) });
      }
    }
  });

  /**
   * DELETE /api/v1/lab-members/:id
   * Labメンバーを削除するエンドポイント
   */
  router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
      const usecase = new DeleteLabMember(labMemberRepository);
      await usecase.execute({ id });
      res.status(204).send(); // No Content
    } catch (error) {
      console.error('Error in DELETE /lab-members/:id:', error);
      if (error instanceof Error) {
          res.status(500).json({ error: 'An unexpected error occurred.', message: error.message, stack: error.stack });
      } else {
          res.status(500).json({ error: 'An unexpected error occurred.', details: JSON.stringify(error) });
      }
    }
  });

  /**
   * POST /api/v1/lab-members/bulk-update-attribute
   * Labメンバーの属性を一括で進級させるエンドポイント
   */
  router.post('/bulk-update-attribute', async (req, res) => {
    const { userId } = req.body; // リクエストを行ったユーザーのID

    if (!userId) {
      return res.status(400).json({ error: 'userId is required.' });
    }

    try {
      const usecase = new BulkUpdateLabMembersAttribute(labMemberRepository);
      const result = await usecase.execute({ userId });
      res.status(200).json(result); // 更新件数などのサマリーを返す
    } catch (error) {
      console.error('Error in POST /lab-members/bulk-update-attribute:', error);
      if (error instanceof Error) {
          res.status(500).json({ error: 'An unexpected error occurred.', message: error.message, stack: error.stack });
      } else {
          res.status(500).json({ error: 'An unexpected error occurred.', details: JSON.stringify(error) });
      }
    }
  });

  return router;
};

