import { z } from "zod";

export const executeBkashPaymentSchema = z.object({
  body: z.object({
    paymentId: z.string().min(1, "Payment ID is required"),
  }),
});
