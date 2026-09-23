/** biome-ignore-all lint/style/noNonNullAssertion: <explanation> */
import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { complaintService } from "./complaint.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

// create Complaint
const createComplaint = catchAsync(async (req: Request, res: Response) => {
	const userId = req.user!.userId;

	const result = await complaintService.createComplaint(userId, req.body);

	res.status(201).json({
		success: true,
		message: "Complaint submitted successfully",
		data: result,
	});
});
// get Own Complaints
const getOwnComplaints = catchAsync(async (req: Request, res: Response) => {
	const userId = req.user!.userId;

	const result = await complaintService.getOwnComplaints(userId, req.query);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Own complaints retrieved successfully",
		data: result,
	});
});

const getOwnComplaint = catchAsync(async (req: Request, res: Response) => {
	const { complaintId } = req.params;

	const result =
		req.user!.role === "ADMIN"
			? await complaintService.getComplaintByAdmin(complaintId as string)
			: await complaintService.getOwnComplaint(
					complaintId as string,
					req.user!.userId,
				);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Own complaint retrieved successfully",
		data: result,
	});
});

// delete Own Complaint
const deleteOwnComplaint = catchAsync(async (req: Request, res: Response) => {
	const complaintId = req.params.id as string;

	if (req.user!.role === "ADMIN") {
		await complaintService.deleteComplaintByAdmin(complaintId);
	} else {
		await complaintService.deleteOwnComplaint(req.user!.userId, complaintId);
	}

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Complaint deleted successfully",
		data: null,
	});
});
// get All Complaints
const getAllComplaints = catchAsync(async (req: Request, res: Response) => {
	const result = await complaintService.getAllComplaints(req.query);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Complaints retrieved successfully",
		data: result,
	});
});

export const complaintController = {
	createComplaint,
	getOwnComplaints,
	getOwnComplaint,
	getAllComplaints,
	deleteOwnComplaint,
};
