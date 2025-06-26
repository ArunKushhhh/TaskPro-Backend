import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { validateRequest } from "zod-express-middleware";
import { projectSchema } from "../utils/validateSchema.utils.js";
import { z } from "zod";
import createProject from "../controllers/project.controller.js";

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

export default router;
