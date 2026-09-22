import type { Request, Response } from "express";
import { ComplaintAssignmentService } from "./complaint-assignment.service";
import { catchAsync } from "../../utils/catchAsync";

const createAssignment = async (req: Request, res: Response) => {
  const result = await ComplaintAssignmentService.createAssignment(
    req.user!.userId,
    req.body,
  );

  res.status(201).json({
    success: true,
    message: "Complaint assigned successfully",
    data: result,
  });
};
// getComplaintAssignments by manager admin and technician
const getComplaintAssignments = async (req: Request, res: Response) => {
  const result = await ComplaintAssignmentService.getComplaintAssignments(
    req.params.complaintId as string,
  );

  res.status(200).json({
    success: true,
    message: "Complaint assignments retrieved successfully",
    data: result,
  });
};
// getMyAssignments by technician
const getMyAssignments = async (req: Request, res: Response) => {
  const result = await ComplaintAssignmentService.getMyAssignments(
    req.user!.userId,
  );

  res.status(200).json({
    success: true,
    message: "Your assignments retrieved successfully",
    data: result,
  });
};
// completeAssignment by technician
const completeAssignment = async (req: Request, res: Response) => {
  const result =  await ComplaintAssignmentService.completeAssignment(
      req.user!.userId,
      req.params.assignmentId as string,
      req.body,
    );

  res.status(200).json({
    success: true,
    message: "Assignment completed successfully",
    data: result,
  });
};

const closeComplaint = catchAsync(
  async (req: Request, res: Response) => {
    const { complaintId } = req.params;

    const result =
      await ComplaintAssignmentService.closeComplaint(
        complaintId as string,
      );

    res.status(200).json({
      success: true,
      message: "Complaint closed successfully",
      data: result,
    });
  },
);

export const ComplaintAssignmentController = {
  createAssignment,
  getComplaintAssignments,
  getMyAssignments,
  completeAssignment,
  closeComplaint,
};
