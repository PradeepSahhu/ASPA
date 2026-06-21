import express from "express";
import AuthenticateUser from "../middleware/authenticate.js";
import {
  CreateNewTicket,
  GetAuthorTickets,
  GetAllTickets,
} from "../controllers/ticket.controller.js";

const router = express.Router();

router.route("/createTicket").post(AuthenticateUser, CreateNewTicket);
router.route("/getTickets").get(AuthenticateUser, GetAuthorTickets);
router.route("/getAllTickets").get(AuthenticateUser, GetAllTickets);

export default router;
