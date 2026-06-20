import express from "express";
import { createBook } from "../controllers/book.controllers.js";
import AuthenticateUser from "../middleware/authenticate.js";

const router = express.Router();

router.route("/createbook").post(AuthenticateUser, createBook);

export default router;
