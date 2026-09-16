import { Router } from "express";
import { complaintController } from "./complaint.controller";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";


const router = Router();

router.post(
  "/",
  auth(Role.CITIZEN),
  complaintController.createComplaint,
);

export const complaintRouter = router;