import express from "express";
import AuthenticateUser from "../middleware/authenticate.js";
import { CreateNewTicket } from "../controllers/ticket.controller.js";

const router = express.Router();

router.route("/createTicket").post(AuthenticateUser, CreateNewTicket);

export default router;
