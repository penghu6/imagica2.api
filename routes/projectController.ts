import express, { Request, Response, NextFunction } from 'express';
import projectService from '../services/projectService';
import { formatResponse } from '../utils/tools';
import { ValidationError } from '../utils/errors';

const router = express.Router();


router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await new projectService().createProject(req.body);
    res.send(formatResponse(0, "项目创建成功", result));
  } catch (error) {
    next(error);
  }
});


router.get("/user/:userId", async (req: Request, res: Response) => {
  const result = await new projectService().getUserProjects(req.params.userId);
  res.send(formatResponse(0, "", result));
});

router.get("/:id", async (req: Request, res: Response) => {
  const result = await new projectService().findProjectById(req.params.id);
  res.send(formatResponse(0, "", result));
});

router.patch("/:id", async (req: Request, res: Response) => {
  const result = await new projectService().updateProject(req.params.id, req.body);
  res.send(formatResponse(0, "", result));
});


router.delete("/:id", async (req: Request, res: Response) => {
  const result = await new projectService().deleteProject(req.params.id);
  res.send(formatResponse(0, "", result));
});

export default router;
