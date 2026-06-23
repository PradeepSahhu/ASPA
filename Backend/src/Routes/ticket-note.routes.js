import express from "express";
import AuthenticateUser from "../middleware/authenticate.js";
import {
  CreateTicketNote,
  GetTicketNotes,
  UpdateTicketNote,
  DeleteTicketNote,
} from "../controllers/ticket-note.controller.js";

const router = express.Router();

router.route("/create").post(AuthenticateUser, CreateTicketNote);
router.route("/ticket/:ticketId").get(AuthenticateUser, GetTicketNotes);
router.route("/update/:noteId").put(AuthenticateUser, UpdateTicketNote);
router.route("/delete/:noteId").delete(AuthenticateUser, DeleteTicketNote);

export default router;
