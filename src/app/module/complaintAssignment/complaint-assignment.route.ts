import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { ComplaintAssignmentController } from "./complaint-assignment.controller";
import { ComplaintAssignmentValidation } from "./complaint-assignment.validation";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

// Manager/Admin assigns complaint
router.post(
  "/",
  auth(Role.MANAGER, Role.ADMIN),
  validateRequest(
    ComplaintAssignmentValidation.createComplaintAssignmentSchema,
  ),
  ComplaintAssignmentController.createAssignment,
);

// Manager/Admin/Technician can see complaint assignments
router.get(
  "/complaint/:complaintId",
  auth(
    Role.MANAGER,
    Role.ADMIN,
    Role.TECHNICIAN,
  ),
  ComplaintAssignmentController.getComplaintAssignments,
);

// Technician sees own assignments
router.get(
  "/my-assignments",
  auth(Role.TECHNICIAN),
  ComplaintAssignmentController.getMyAssignments,
);

// Technician completes assignment
router.patch(
  "/:assignmentId/complete",
  auth(Role.TECHNICIAN),
  ComplaintAssignmentController.completeAssignment,
);

router.patch(
  "/:complaintId/close",
  auth(Role.MANAGER, Role.ADMIN),
  ComplaintAssignmentController.closeComplaint,
);

export const ComplaintAssignmentRoutes = router;