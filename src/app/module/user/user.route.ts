import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { upload } from "../../lib/multer";
import { auth } from "../../middleware/checkAuth";
import { UserController } from "./user.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { UserValidation } from "./user.validation";

const router = Router();
router.get("/", auth(Role.ADMIN), UserController.getAllUsers);
router.patch(
	"/profile-image",
	auth(Role.MANAGER, Role.ADMIN, Role.TECHNICIAN, Role.STAFF, Role.CITIZEN),
	upload.single("profileImage"),
	UserController.uploadProfileImage,
);
router.patch(
	"/:userId/status",
	auth(Role.ADMIN),
	validateRequest(UserValidation.updateUserStatusSchema),
	UserController.updateUserStatus,
);

router.patch(
	"/:userId/role",
	auth(Role.ADMIN),
	validateRequest(UserValidation.updateUserRoleSchema),
	UserController.updateUserRole,
);
router.delete("/:userId", auth(Role.ADMIN), UserController.deleteUser);
export const UserRoutes = router;
