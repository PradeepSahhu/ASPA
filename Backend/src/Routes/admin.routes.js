import {
  AdminLogin,
  AdminLogout,
  AdminSignUp,
} from "../controllers/admin.controllers.js";
import AuthenticateUser from "../middleware/authenticate.js";

import express from "express";

const router = express.Router();

router.route("/login").post(AdminLogin);
router.route("/signup").post(AdminSignUp);
router.route("/logout").post(AuthenticateUser, AdminLogout);

export default router;
