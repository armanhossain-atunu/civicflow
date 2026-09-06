import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { UserValidation } from "./auth.validation";
import { AuthController } from "./auth.controller";
import { validateRequest } from "../../middleware/validateRequest";

const router = Router();

router.post(
  "/register",
  validateRequest(UserValidation.citizenRegistrationZodSchema),
  AuthController.registerUser,
);
router.post(
  "/login",
  validateRequest(UserValidation.LoginZodSchema),
  AuthController.loginUser,
);
router.post(
  "/forget-password",
  validateRequest(UserValidation.forgetPasswordZodSchema),
  AuthController.forgetPassword,
);
router.post(
  "/reset-password",
  validateRequest(UserValidation.resetPasswordZodSchema),
  AuthController.resetPassword,
);
router.get(
  "/me",
  auth(Role.ADMIN, Role.MANAGER, Role.TECHNICIAN, Role.CITIZEN, Role.STAFF),
  AuthController.getMe,
);
router.post("/refresh-token", AuthController.refreshToken);
router.post("/google", AuthController.googleLogin);
export const AuthRoutes = router;
