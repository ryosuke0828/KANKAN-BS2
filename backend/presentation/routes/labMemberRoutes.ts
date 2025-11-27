import { Router, Request, Response } from 'express';
import { CreateLabMember } from '../../application/usecases/lab-member/CreateLabMember.js';
import { GetLabMember } from '../../application/usecases/lab-member/GetLabMember.js';
import { UpdateLabMember } from '../../application/usecases/lab-member/UpdateLabMember.js';
import { DeleteLabMember } from '../../application/usecases/lab-member/DeleteLabMember.js';
import { BulkUpdateLabMembersAttribute } from '../../application/usecases/lab-member/BulkUpdateLabMembersAttribute.js';
import { ListLabMembers } from '../../application/usecases/lab-member/ListLabMembers.js';
import { ILabMemberRepository } from '../../domain/interfaces/ILabMemberRepository.js';

export const createLabMemberRouter = (labMemberRepository: ILabMemberRepository): Router => {
  const router = Router();

  /**
   * GET /api/v1/lab-members
   * ログインユーザーに紐づくLabメンバーの一覧を取得するエンドポイント
   */
  router.get('/', async (req: Request, res: Response) => {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User ID not found in token.' });
    }

    try {
      const usecase = new ListLabMembers(labMemberRepository);
      const labMembers = await usecase.execute({ userId });
      res.status(200).json(labMembers);
    } catch (error: any) {
      console.error('Error in GET /lab-members:', error);
      if (error instanceof Error) {
        res.status(500).json({ error: 'An unexpected error occurred.', message: error.message });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred.' });
      }
    }
  });

  /**
   * POST /api/v1/lab-members
   * Labメンバーを作成するエンドポイント
   */
  router.post('/', async (req: Request, res: Response) => {
    const { name, attribute, slackDmId } = req.body;
    const userId = (req.user as any)?.id;

    if (!name || !attribute || !slackDmId || !userId) {
      return res.status(400).json({ error: 'name, attribute, slackDmId are required and user must be authenticated.' });
    }

    try {
      const usecase = new CreateLabMember(labMemberRepository);
      const newLabMember = await usecase.execute({ name, attribute, slackDmId, userId });
      res.status(201).json(newLabMember);
    } catch (error: any) {
      console.error('Error in POST /lab-members:', error);
      if (error instanceof Error) {
          res.status(500).json({ error: 'An unexpected error occurred.', message: error.message });
      } else {
          res.status(500).json({ error: 'An unexpected error occurred.' });
      }
    }
  });

  /**
   * GET /api/v1/lab-members/:id
   * Labメンバーを取得するエンドポイント
   */
  router.get('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const usecase = new GetLabMember(labMemberRepository);
      const labMember = await usecase.execute({ id });

      if (!labMember) {
        return res.status(404).json({ error: 'LabMember not found.' });
      }
      res.status(200).json(labMember);
    } catch (error: any) {
      console.error('Error in GET /lab-members/:id:', error);
      if (error instanceof Error) {
          res.status(500).json({ error: 'An unexpected error occurred.', message: error.message });
      } else {
          res.status(500).json({ error: 'An unexpected error occurred.' });
      }
    }
  });

  /**
   * PUT /api/v1/lab-members/:id
   * Labメンバーを更新するエンドポイント
   */
  router.put('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, attribute, slackDmId } = req.body;
    const userId = (req.user as any)?.id;

    try {
      const usecase = new UpdateLabMember(labMemberRepository);
      // Ensure the member belongs to the user before updating? (Logic could be in usecase)
      const updatedLabMember = await usecase.execute({ id, name, attribute, slackDmId, userId });

      if (!updatedLabMember) {
        return res.status(404).json({ error: 'LabMember not found.' });
      }
      res.status(200).json(updatedLabMember);
    } catch (error: any) {
      console.error('Error in PUT /lab-members/:id:', error);
      if (error instanceof Error) {
          res.status(500).json({ error: 'An unexpected error occurred.', message: error.message });
      } else {
          res.status(500).json({ error: 'An unexpected error occurred.' });
      }
    }
  });

  /**
   * DELETE /api/v1/lab-members/:id
   * Labメンバーを削除するエンドポイント
   */
  router.delete('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      // Ensure the member belongs to the user before deleting? (Logic could be in usecase)
      const usecase = new DeleteLabMember(labMemberRepository);
      await usecase.execute({ id });
      res.status(204).send(); // No Content
    } catch (error: any) {
      console.error('Error in DELETE /lab-members/:id:', error);
      if (error instanceof Error) {
          res.status(500).json({ error: 'An unexpected error occurred.', message: error.message });
      } else {
          res.status(500).json({ error: 'An unexpected error occurred.' });
      }
    }
  });

  /**
   * POST /api/v1/lab-members/bulk-update-attribute
   * Labメンバーの属性を一括で進級させるエンドポイント
   */
  router.post('/bulk-update-attribute', async (req: Request, res: Response) => {
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User ID not found in token.' });
    }

    try {
      const usecase = new BulkUpdateLabMembersAttribute(labMemberRepository);
      const result = await usecase.execute({ userId });
      res.status(200).json(result);
    } catch (error: any) {
      console.error('Error in POST /lab-members/bulk-update-attribute:', error);
      if (error instanceof Error) {
          res.status(500).json({ error: 'An unexpected error occurred.', message: error.message });
      } else {
          res.status(500).json({ error: 'An unexpected error occurred.' });
      }
    }
  });

  return router;
};
