import express, { Router } from 'express';

export const createTestServer = (router: Router, routePath: string) => {
  const app = express();
  app.use(express.json());
  app.use(routePath, router);
  return app;
};