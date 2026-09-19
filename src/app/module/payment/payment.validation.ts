import { z } from "zod";

const createPayment = z.object({
  body: z.object({
    complaintId: z
      .string()
      .uuid("Invalid complaint ID"),
  }),
});

const executePayment = z.object({
  body: z.object({
    paymentID: z
      .string()
      .min(1, "Payment ID is required"),
  }),
});

const paymentIdParam = z.object({
  params: z.object({
    id: z
      .string()
      .uuid("Invalid payment ID"),
  }),
});

export const PaymentValidation = {
  createPayment,
  executePayment,
  paymentIdParam,
};