import httpStatus from "http-status";
import { ComplaintStatus, Role } from "../../../generated/prisma/enums";

import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";

import type { ICreateFeedback, IUpdateFeedback } from "./feedback.interface";

// =====================================================
// CREATE FEEDBACK
// =====================================================

const createFeedback = async (citizenId: string, payload: ICreateFeedback) => {
	const { complaintId, rating, comment } = payload;

	// Check complaint
	const complaint = await prisma.complaint.findUnique({
		where: {
			id: complaintId,
		},
		select: {
			id: true,
			trackingId: true,
			title: true,
			status: true,
			citizenId: true,
			categoryName: true,
		},
	});

	if (!complaint) {
		throw new AppError(httpStatus.NOT_FOUND, "Complaint not found");
	}

	// Complaint ownership check
	if (complaint.citizenId !== citizenId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You can only give feedback for your own complaint",
		);
	}

	// Complaint status check
	if (
		complaint.status !== ComplaintStatus.RESOLVED &&
		complaint.status !== ComplaintStatus.CLOSED
	) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Feedback can only be given for a resolved or closed complaint",
		);
	}

	// Check existing feedback
	const existingFeedback = await prisma.feedback.findUnique({
		where: {
			complaintId,
		},
	});

	if (existingFeedback) {
		throw new AppError(
			httpStatus.CONFLICT,
			"Feedback has already been submitted for this complaint",
		);
	}

	// Create feedback
	const feedback = await prisma.feedback.create({
		data: {
			rating,
			comment,
			complaintId,
			citizenId,
		},

		include: {
			complaint: {
				select: {
					id: true,
					trackingId: true,
					title: true,
					status: true,
					categoryName: true,
				},
			},

			citizen: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
		},
	});

	return feedback;
};

// =====================================================
// GET OWN FEEDBACKS
// =====================================================

const getOwnFeedbacks = async (
	citizenId: string,
	query: {
		page?: number;
		limit?: number;
		rating?: number;
		search?: string;
		sortBy?: "createdAt" | "rating";
		sortOrder?: "asc" | "desc";
	},
) => {
	const page = query.page ?? 1;
	const limit = query.limit ?? 10;
	const skip = (page - 1) * limit;

	const sortBy = query.sortBy ?? "createdAt";
	const sortOrder = query.sortOrder ?? "desc";

	const where = {
		citizenId,

		...(query.rating
			? {
					rating: query.rating,
				}
			: {}),

		...(query.search
			? {
					OR: [
						{
							comment: {
								contains: query.search,
								mode: "insensitive" as const,
							},
						},
						{
							complaint: {
								title: {
									contains: query.search,
									mode: "insensitive" as const,
								},
							},
						},
						{
							complaint: {
								trackingId: {
									contains: query.search,
									mode: "insensitive" as const,
								},
							},
						},
					],
				}
			: {}),
	};

	const [feedbacks, total] = await prisma.$transaction([
		prisma.feedback.findMany({
			where,

			skip,
			take: limit,

			orderBy: {
				[sortBy]: sortOrder,
			},

			include: {
				complaint: {
					select: {
						id: true,
						trackingId: true,
						title: true,
						status: true,
						categoryName: true,
						department: true,
					},
				},
			},
		}),

		prisma.feedback.count({
			where,
		}),
	]);

	return {
		meta: {
			page,
			limit,
			total,
			totalPage: Math.ceil(total / limit),
		},

		data: feedbacks,
	};
};

// =====================================================
// GET SINGLE FEEDBACK
// =====================================================

const getFeedbackById = async (
	feedbackId: string,
	userId: string,
	role: Role,
) => {
	const feedback = await prisma.feedback.findUnique({
		where: {
			id: feedbackId,
		},

		include: {
			complaint: {
				select: {
					id: true,
					trackingId: true,
					title: true,
					description: true,
					status: true,
					priority: true,
					categoryName: true,
					department: true,
					location: true,
				},
			},

			citizen: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
		},
	});

	if (!feedback) {
		throw new AppError(httpStatus.NOT_FOUND, "Feedback not found");
	}

	// Citizen can only see own feedback
	if (role === Role.CITIZEN && feedback.citizenId !== userId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You can only access your own feedback",
		);
	}

	return feedback;
};

// =====================================================
// UPDATE OWN FEEDBACK
// =====================================================

const updateFeedback = async (
	feedbackId: string,
	citizenId: string,
	payload: IUpdateFeedback,
) => {
	const feedback = await prisma.feedback.findUnique({
		where: {
			id: feedbackId,
		},

		include: {
			complaint: {
				select: {
					id: true,
					status: true,
				},
			},
		},
	});

	if (!feedback) {
		throw new AppError(httpStatus.NOT_FOUND, "Feedback not found");
	}

	// Ownership check
	if (feedback.citizenId !== citizenId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You can only update your own feedback",
		);
	}

	// Update
	const updatedFeedback = await prisma.feedback.update({
		where: {
			id: feedbackId,
		},

		data: {
			...(payload.rating !== undefined
				? {
						rating: payload.rating,
					}
				: {}),

			...(payload.comment !== undefined
				? {
						comment: payload.comment,
					}
				: {}),
		},

		include: {
			complaint: {
				select: {
					id: true,
					trackingId: true,
					title: true,
					status: true,
					categoryName: true,
				},
			},
		},
	});

	return updatedFeedback;
};

// =====================================================
// DELETE OWN FEEDBACK
// =====================================================

const deleteFeedback = async (feedbackId: string, citizenId: string) => {
	const feedback = await prisma.feedback.findUnique({
		where: {
			id: feedbackId,
		},
	});

	if (!feedback) {
		throw new AppError(httpStatus.NOT_FOUND, "Feedback not found");
	}

	if (feedback.citizenId !== citizenId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You can only delete your own feedback",
		);
	}

	await prisma.feedback.delete({
		where: {
			id: feedbackId,
		},
	});

	return null;
};

// =====================================================
// GET ALL FEEDBACKS - ADMIN / MANAGER
// =====================================================

const getAllFeedbacks = async (query: {
	page?: number;
	limit?: number;
	rating?: number;
	search?: string;
	sortBy?: "createdAt" | "rating";
	sortOrder?: "asc" | "desc";
}) => {
	const page = query.page ?? 1;
	const limit = query.limit ?? 10;
	const skip = (page - 1) * limit;

	const sortBy = query.sortBy ?? "createdAt";
	const sortOrder = query.sortOrder ?? "desc";

	const where = {
		...(query.rating
			? {
					rating: query.rating,
				}
			: {}),

		...(query.search
			? {
					OR: [
						{
							comment: {
								contains: query.search,
								mode: "insensitive" as const,
							},
						},
						{
							complaint: {
								title: {
									contains: query.search,
									mode: "insensitive" as const,
								},
							},
						},
						{
							complaint: {
								trackingId: {
									contains: query.search,
									mode: "insensitive" as const,
								},
							},
						},
						{
							citizen: {
								name: {
									contains: query.search,
									mode: "insensitive" as const,
								},
							},
						},
						{
							citizen: {
								email: {
									contains: query.search,
									mode: "insensitive" as const,
								},
							},
						},
					],
				}
			: {}),
	};

	const [feedbacks, total] = await prisma.$transaction([
		prisma.feedback.findMany({
			where,

			skip,
			take: limit,

			orderBy: {
				[sortBy]: sortOrder,
			},

			include: {
				complaint: {
					select: {
						id: true,
						trackingId: true,
						title: true,
						status: true,
						categoryName: true,
						department: true,
					},
				},

				citizen: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
		}),

		prisma.feedback.count({
			where,
		}),
	]);

	return {
		data: feedbacks,
		meta: {
			page,
			limit,
			total,
			totalPage: Math.ceil(total / limit),
		},
	};
};

// =====================================================
// EXPORT
// =====================================================

export const feedbackService = {
	createFeedback,
	getOwnFeedbacks,
	getFeedbackById,
	updateFeedback,
	deleteFeedback,
	getAllFeedbacks,
};
