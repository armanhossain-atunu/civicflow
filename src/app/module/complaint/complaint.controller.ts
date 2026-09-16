import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { complaintService } from "./complaint.service";

const createComplaint = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const result = await complaintService.createComplaint(
      userId,
      req.body,
    );

    res.status(201).json({
      success: true,
      message: "Complaint submitted successfully",
      data: result,
    });
  },
);

export const complaintController = {
  createComplaint,
};