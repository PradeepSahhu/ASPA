import express from "express";
import AuthenticateUser from "../middleware/authenticate.js";
import {
  CreateNewTicket,
  GetAuthorTickets,
  GetAllTickets,
  OverridePriority,
  MarkTicketResolved,
  UnresolveTicket,
  GetTicketDetail,
} from "../controllers/ticket.controller.js";

const router = express.Router();

router.route("/createTicket").post(AuthenticateUser, CreateNewTicket);
router.route("/getTickets").get(AuthenticateUser, GetAuthorTickets);
router.route("/getAllTickets").get(AuthenticateUser, GetAllTickets);
router.route("/overridePriority").put(AuthenticateUser, OverridePriority);
router.route("/resolve").put(AuthenticateUser, MarkTicketResolved);
router.route("/unresolve").put(AuthenticateUser, UnresolveTicket);
router.route("/getTicket/:ticketId").get(AuthenticateUser, GetTicketDetail);

export default router;
