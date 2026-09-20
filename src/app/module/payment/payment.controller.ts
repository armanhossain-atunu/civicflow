import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { paymentService } from "./payment.service";

const createBkashPayment = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.createBkashPayment(
    req.user!.userId,
    req.params.complaintId as string,
  );

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Bkash payment created successfully",
    data: result,
  });
});

const executeBkashPayment = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.executeBkashPayment(
    req.body.paymentId,
    req.user!.userId,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payment completed successfully",
    data: result,
  });
});

const bkashCallback = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.executeBkashPayment(
    req.query.paymentID as string,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payment completed successfully",
    data: result,
  });
});

export const paymentController = {
  createBkashPayment,
  executeBkashPayment,
  bkashCallback,
};
