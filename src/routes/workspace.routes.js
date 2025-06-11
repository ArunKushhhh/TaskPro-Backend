import express from "express";
import { workspaceSchema } from "../utils/validateSchema.utils.js";
import { validateRequest } from "zod-express-middleware";
import authMiddleware from "../middlewares/authMiddleware.js";
import { createWorkspace, getWorkspaces } from "../controllers/workspace.controller.js";

const router = express.Router();

router.get("/", authMiddleware, getWorkspaces);

router.post(
  "/",
  authMiddleware,
  validateRequest({
    body: workspaceSchema,
  }),
  createWorkspace
);

export default router;
