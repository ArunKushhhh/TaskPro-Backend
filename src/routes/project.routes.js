import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { validateRequest } from "zod-express-middleware";
import { projectSchema } from "../utils/validateSchema.utils.js";
import { z } from "zod";
import  { createProject, getProjectDetails, getProjectTasks } from "../controllers/project.controller.js";

const router = express.Router();

router.post(
  "/:workspaceId/create-project",
  authMiddleware,
  validateRequest({
    params: z.object({
      workspaceId: z.string(),
    }),
    body: projectSchema,
  }),
  createProject
);

router.get(
  "/:projectId",
  authMiddleware,
  validateRequest({
    params: z.object({ projecId: z.string() }),
  }),
  getProjectDetails
);

router.get(
  "/:projectId/tasks",
  authMiddleware,
  validateRequest({ params: z.object({ projectId: z.string() }) }),
  getProjectTasks
);

export default router;
