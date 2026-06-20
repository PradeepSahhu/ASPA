import express from "express";
import { createBook, GetBooksByUser } from "../controllers/book.controllers.js";
import AuthenticateUser from "../middleware/authenticate.js";

const router = express.Router();

router.route("/createbook").post(AuthenticateUser, createBook);
router.route("/getBooks").get(AuthenticateUser, GetBooksByUser);

export default router;
