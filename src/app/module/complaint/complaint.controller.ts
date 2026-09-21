import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { complaintService } from "./complaint.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const createComplaint = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const result = await complaintService.createComplaint(userId, req.body);

  res.status(201).json({
    success: true,
    message: "Complaint submitted successfully",
    data: result,
  });
});

const getOwnComplaints = catchAsync(async (req: Request, res: Response) => {
  const result = await complaintService.getOwnComplaints(req.user!.userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Own complaints fetched successfully",
    data: result,
  });
});

const deleteOwnComplaint = catchAsync(async (req: Request, res: Response) => {
  await complaintService.deleteOwnComplaint(
    req.user!.userId,
    req.params.id as string,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Complaint deleted successfully",
    data: null,
  });
});
const getAllComplaints = catchAsync(
  async (req: Request, res: Response) => {
    const result = await complaintService.getAllComplaints(
      req.query,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Complaints retrieved successfully",
      data: result,
    });
  },
);

export const complaintController = {
  createComplaint,
  getOwnComplaints,
  getAllComplaints,
  deleteOwnComplaint,
};
