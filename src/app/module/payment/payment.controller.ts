import type { Request, Response } from "express";
import { paymentService } from "./payment.service";

const createPayment = async (
  req: Request,
  res: Response,
) => {
  const userId = req.user!.userId;

  const result =
    await paymentService.createPayment(
      userId,
      req.body,
    );

  res.status(201).json({
    success: true,
    message: "Payment initialized successfully",
    data: result,
  });
};

const executePayment = async (
  req: Request,
  res: Response,
) => {
  const userId = req.user!.userId;

  const result =
    await paymentService.executePayment(
      userId,
      req.body.paymentID,
    );

  res.status(200).json({
    success: true,
    message: "Payment completed successfully",
    data: result,
  });
};

const getOwnPayment = async (
  req: Request,
  res: Response,
) => {
  const userId = req.user!.userId;

  const result =
    await paymentService.getOwnPayment(
      userId,
      req.params.id as string,
    );

  res.status(200).json({
    success: true,
    message: "Payment retrieved successfully",
    data: result,
  });
};

const getAllPayments = async (
  _req: Request,
  res: Response,
) => {
  const result =
    await paymentService.getAllPayments();

  res.status(200).json({
    success: true,
    message: "Payments retrieved successfully",
    data: result,
  });
};

export const PaymentController = {
  createPayment,
  executePayment,
  getOwnPayment,
  getAllPayments,
};