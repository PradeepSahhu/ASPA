import express from "express";
import { llmTest } from "../controllers/llm.test.js";
import Authenticate from "../middleware/authenticate.js";
const router = express.Router();

router.route("/").post(Authenticate, llmTest);

export default router;
