import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import { PaymentController } from "./payment.controller";
import { PaymentValidation } from "./payment.validation";

const router = Router();

router.post(
  "/",
  auth(Role.CITIZEN),
  validateRequest(PaymentValidation.createPayment),
  PaymentController.createPayment,
);
router.post(
  "/execute",
  auth(Role.CITIZEN),
  validateRequest(PaymentValidation.executePayment),
  PaymentController.executePayment,
);

router.get(
  "/:id",
  auth(Role.CITIZEN),
  validateRequest(PaymentValidation.paymentIdParam),
  PaymentController.getOwnPayment,
);

router.get(
  "/",
  auth(Role.ADMIN, Role.MANAGER),
  PaymentController.getAllPayments,
);

export const PaymentRoutes = router;
