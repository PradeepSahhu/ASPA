import express from "express";
import {
  AuthorLogin,
  AuthorSignUp,
  AuthorLogout,
} from "../controllers/author.controllers.js";
import AuthenticateUser from "../middleware/authenticate.js";
const router = express.Router();

router.route("/login").post(AuthorLogin);
router.route("/signup").post(AuthorSignUp);
router.route("/logout").post(AuthenticateUser, AuthorLogout);

export default router;
