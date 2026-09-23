import type { Request, Response } from "express";
import httpStatus from "http-status";

import { catchAsync } from "../../utils/catchAsync";
import { feedbackService } from "./feedback.service";

// =====================================================
// CREATE
// =====================================================

const createFeedback = catchAsync(async (req: Request, res: Response) => {
	const citizenId = req.user!.userId;

	const result = await feedbackService.createFeedback(citizenId, req.body);

	res.status(httpStatus.CREATED).json({
		success: true,
		message: "Feedback submitted successfully",
		data: result,
	});
});

// =====================================================
// GET OWN
// =====================================================

const getOwnFeedbacks = catchAsync(async (req: Request, res: Response) => {
	const citizenId = req.user!.userId;

	const result = await feedbackService.getOwnFeedbacks(
		citizenId,
		req.query as {
			page?: number;
			limit?: number;
			rating?: number;
			search?: string;
			sortBy?: "createdAt" | "rating";
			sortOrder?: "asc" | "desc";
		},
	);

	res.status(httpStatus.OK).json({
		success: true,
		message: "Own feedbacks retrieved successfully",
		...result,
	});
});

// =====================================================
// GET SINGLE
// =====================================================

const getFeedbackById = catchAsync(async (req: Request, res: Response) => {
	const userId = req.user!.userId;
	const role = req.user!.role;

	const result = await feedbackService.getFeedbackById(
		req.params.id as string,
		userId,
		role,
	);

	res.status(httpStatus.OK).json({
		success: true,
		message: "Feedback retrieved successfully",
		data: result,
	});
});

// =====================================================
// UPDATE
// =====================================================

const updateFeedback = catchAsync(async (req: Request, res: Response) => {
	const citizenId = req.user!.userId;

	const result = await feedbackService.updateFeedback(
		req.params.id as string,
		citizenId,
		req.body,
	);

	res.status(httpStatus.OK).json({
		success: true,
		message: "Feedback updated successfully",
		data: result,
	});
});

// =====================================================
// DELETE
// =====================================================

const deleteFeedback = catchAsync(async (req: Request, res: Response) => {
	const citizenId = req.user!.userId;

	await feedbackService.deleteFeedback(req.params.id as string, citizenId);

	res.status(httpStatus.OK).json({
		success: true,
		message: "Feedback deleted successfully",
		data: null,
	});
});

// =====================================================
// GET ALL
// =====================================================

const getAllFeedbacks = catchAsync(async (req: Request, res: Response) => {
	const result = await feedbackService.getAllFeedbacks(
		req.query as {
			page?: number;
			limit?: number;
			rating?: number;
			search?: string;
			sortBy?: "createdAt" | "rating";
			sortOrder?: "asc" | "desc";
		},
	);

	res.status(httpStatus.OK).json({
		success: true,
		message: "All feedbacks retrieved successfully",
		...result,
	});
});

export const feedbackController = {
	createFeedback,
	getOwnFeedbacks,
	getFeedbackById,
	updateFeedback,
	deleteFeedback,
	getAllFeedbacks,
};
