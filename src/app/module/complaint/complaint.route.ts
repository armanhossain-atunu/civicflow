import { Router } from "express";
import { complaintController } from "./complaint.controller";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import { createComplaintSchema } from "./complaint.validation";

const router = Router();

router.post(
	"/",
	auth(Role.CITIZEN),
	validateRequest(createComplaintSchema),
	complaintController.createComplaint,
);
router.get(
	"/",
	auth(Role.ADMIN, Role.MANAGER, Role.TECHNICIAN, Role.CITIZEN),
	complaintController.getAllComplaints,
);
router.get("/my", auth(Role.CITIZEN), complaintController.getOwnComplaints);
router.delete(
	"/:id",
	auth(Role.ADMIN, Role.CITIZEN),
	complaintController.deleteOwnComplaint,
);
router.get(
	"/:complaintId",
	auth(Role.ADMIN, Role.CITIZEN, Role.MANAGER, Role.TECHNICIAN),
	complaintController.getOwnComplaint,
);

export const complaintRouter = router;
