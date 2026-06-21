import express from "express";
import {
  createNewMessage,
  GetConversationMessages,
} from "../controllers/ticket-message.controller.js";
import Authenticate from "../middleware/authenticate.js";

const router = express.Router();

router
  .route("/:conversationId")
  .get(Authenticate, GetConversationMessages)
  .post(Authenticate, createNewMessage);

export default router;
