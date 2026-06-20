import express from "express";
import { AuthorLogin } from "../controllers/author.controllers.js";
const router = express.Router();

router.route("/login").post(AuthorLogin);

export default router;
