import express from "express";
import {
  AuthorLogin,
  AuthorSignUp,
} from "../controllers/author.controllers.js";
const router = express.Router();

router.route("/login").post(AuthorLogin);
router.route("/signup").post(AuthorSignUp);

export default router;
