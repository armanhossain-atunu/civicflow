import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { Role } from "../../../generated/prisma/enums";
import { paymentController } from "./payment.controller";
import { executeBkashPaymentSchema } from "./payment.validation";

const router = Router();

router.post(
  "/complaint/:complaintId/bkash/create",
  auth(Role.CITIZEN),
  paymentController.createBkashPayment,
);
router.post(
  "/bkash/execute",
  auth(Role.CITIZEN),
  validateRequest(executeBkashPaymentSchema),
  paymentController.executeBkashPayment,
);
router.get("/my-payments", auth(Role.CITIZEN), paymentController.getMyPayments);
router.get(
  "/",
  auth(Role.ADMIN, Role.MANAGER),
  paymentController.getAllPayments,
);
router.get("/bkash/callback", paymentController.bkashCallback);

export const paymentRouter = router;
