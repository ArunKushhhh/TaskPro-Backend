import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";
import { taskSchema } from "../utils/validateSchema.utils.js";
import { createTask } from "../controllers/task.controller.js";

const router = express.Router();

router.post(
  "/:projectId/create-task",
  authMiddleware,
  validateRequest({
    params: z.object({
      projectId: z.string(),
    }),
    body: taskSchema,
  }),
  createTask
);

export default router;
