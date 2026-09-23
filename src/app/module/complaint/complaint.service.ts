import type { ComplaintStatus, Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type { ICreateComplaint } from "./complaint.interface";
import httpStatus from "http-status";

const createComplaint = async (userId: string, payload: ICreateComplaint) => {
	// ============================================
	// 1. Check Category
	// ============================================

	const category = await prisma.category.findUnique({
		where: {
			id: payload.categoryId,
		},
	});

	if (!category) {
		throw new Error("Category not found");
	}

	// ============================================
	// 2. Category must be active
	// ============================================

	if (!category.isActive) {
		throw new Error("This category is not active");
	}

	// ============================================
	// 3. Department must match
	// ============================================

	if (category.department !== payload.department) {
		throw new Error("Selected department does not match the selected category");
	}

	// ============================================
	// 4. Validate payment configuration
	// ============================================

	if (category.paymentRequired && !category.paymentAmount) {
		throw new Error("Payment amount is not configured for this category");
	}

	if (!category.paymentRequired && category.paymentAmount) {
		throw new Error("Invalid payment configuration for this category");
	}

	// ============================================
	// 5. Check duplicate active complaint
	// ============================================

	const existingComplaint = await prisma.complaint.findFirst({
		where: {
			citizenId: userId,
			categoryId: payload.categoryId,
			categoryName: category.name,
			department: category.department,
			location: payload.location,

			status: {
				not: "CLOSED",
			},
		},
	});

	if (existingComplaint) {
		throw new Error(
			"You already have an active complaint for this category, department and location",
		);
	}

	// ============================================
	// 6. Generate tracking ID
	// ============================================

	const trackingId = `CF-${Date.now()}`;

	// ============================================
	// 7. Create Complaint + Payment
	//    inside transaction
	// ============================================

	const complaint = await prisma.$transaction(async (tx) => {
		// ------------------------------------------
		// Create Complaint
		// ------------------------------------------

		const newComplaint = await tx.complaint.create({
			data: {
				trackingId,

				title: payload.title,
				description: payload.description,

				citizenId: userId,
				categoryId: payload.categoryId,

				// Category snapshot
				categoryName: category.name,
				department: category.department,
				location: payload.location,

				// --------------------------------------
				// Payment configuration
				// --------------------------------------

				paymentAmount: category.paymentRequired ? category.paymentAmount : null,

				paymentStatus: category.paymentRequired ? "PENDING" : "NOT_REQUIRED",

				// --------------------------------------
				// Complaint status
				// --------------------------------------

				status: category.paymentRequired ? "PAYMENT_PENDING" : "SUBMITTED",
			},
		});

		// ------------------------------------------
		// Create Payment
		// Only for paid category
		// ------------------------------------------

		if (category.paymentRequired) {
			await tx.payment.create({
				data: {
					amount: category.paymentAmount!,
					status: "PENDING",
					method: "BKASH",
					citizenId: userId,
					complaintId: newComplaint.id,
				},
			});
		}

		return newComplaint;
	});

	// ============================================
	// 8. Return Complaint + Payment
	// ============================================

	const result = await prisma.complaint.findUnique({
		where: {
			id: complaint.id,
		},

		include: {
			category: true,
		},
	});

	return result;
};

// ==================================================
// Get Own Complaints
// ==================================================
const getOwnComplaints = async (
	userId: string,
	query: {
		page?: number;
		limit?: number;
		search?: string;
		status?: ComplaintStatus;
		sortBy?: "createdAt" | "title" | "status";
		sortOrder?: "asc" | "desc";
	},
) => {
	const page = Number(query.page) || 1;
	const limit = Number(query.limit) || 10;

	const skip = (page - 1) * limit;

	const search = query.search?.trim();

	const where: Prisma.ComplaintWhereInput = {
		citizenId: userId,

		...(query.status && {
			status: query.status,
		}),

		...(search && {
			OR: [
				{
					title: {
						contains: search,
						mode: "insensitive",
					},
				},
				{
					category: {
						name: {
							contains: search,
							mode: "insensitive",
						},
					},
				},
			],
		}),
	};

	const sortBy = query.sortBy || "createdAt";
	const sortOrder = query.sortOrder || "desc";

	const [complaints] = await Promise.all([
		prisma.complaint.findMany({
			where,

			include: {
				category: true,
				payment: true,
			},

			skip,
			take: limit,

			orderBy: {
				[sortBy]: sortOrder,
			},
		}),

		prisma.complaint.count({
			where,
		}),
	]);

	return {
		// meta: {
		//   page,
		//   limit,
		//   total,
		//   totalPage: Math.ceil(total / limit),
		// },

		data: complaints,
	};
};

// ==================================================
// Get Single Own Complaints
// ==================================================
const getOwnComplaint = async (complaintId: string, userId: string) => {
	const complaint = await prisma.complaint.findFirst({
		where: {
			id: complaintId,
			citizenId: userId,
		},
		include: {
			category: true,
			payment: true,
		},
	});

	if (!complaint) {
		throw new AppError(httpStatus.NOT_FOUND, "Complaint not found");
	}

	return complaint;
};

// ==================================================
// Get All Complaints
// ==================================================

const getAllComplaints = async (query: {
	page?: number;
	limit?: number;
	search?: string;
	status?: ComplaintStatus;
	sortBy?: "createdAt" | "title" | "status";
	sortOrder?: "asc" | "desc";
}) => {
	const page = Number(query.page) || 1;
	const limit = Number(query.limit) || 10;

	const skip = (page - 1) * limit;

	const search = query.search?.trim();

	const where: Prisma.ComplaintWhereInput = {
		...(query.status && {
			status: query.status,
		}),

		...(search && {
			OR: [
				{
					title: {
						contains: search,
						mode: "insensitive",
					},
				},
				{
					category: {
						name: {
							contains: search,
							mode: "insensitive",
						},
					},
				},
			],
		}),
	};

	const sortBy = query.sortBy || "createdAt";
	const sortOrder = query.sortOrder || "desc";

	const [complaints] = await Promise.all([
		prisma.complaint.findMany({
			where,

			include: {
				category: true,

				citizen: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},

				assignments: {
					include: {
						assignedTo: {
							select: {
								id: true,
								name: true,
								email: true,
								role: true,
							},
						},

						assignedBy: {
							select: {
								id: true,
								name: true,
								email: true,
								role: true,
							},
						},
					},
				},

				payment: true,
			},

			skip,
			take: limit,

			orderBy: {
				[sortBy]: sortOrder,
			},
		}),

		prisma.complaint.count({
			where,
		}),
	]);

	return {
		// meta: {
		//   page,
		//   limit,
		//   total,
		//   totalPage: Math.ceil(total / limit),
		// },

		data: complaints,
	};
};
// ==================================================
// Delete Own Complaint
// ==================================================

const deleteOwnComplaint = async (userId: string, complaintId: string) => {
	// ------------------------------------------
	// Find complaint
	// ------------------------------------------

	const complaint = await prisma.complaint.findFirst({
		where: {
			id: complaintId,
			citizenId: userId,
		},

		include: {
			payment: true,
		},
	});

	if (!complaint) {
		throw new Error("Complaint not found");
	}

	// ------------------------------------------
	// Only allow deletion before processing
	// ------------------------------------------

	if (
		complaint.status !== "SUBMITTED" &&
		complaint.status !== "PAYMENT_PENDING"
	) {
		throw new Error("Complaint cannot be deleted after processing has started");
	}

	// ------------------------------------------
	// Soft delete complaint
	// ------------------------------------------

	await prisma.$transaction(async (tx) => {
		await tx.payment.deleteMany({
			where: {
				complaintId,
			},
		});

		await tx.complaint.delete({
			where: {
				id: complaintId,
			},
		});
	});

	return complaint;
};
// ==================================================
// Export
// ==================================================

export const complaintService = {
	createComplaint,
	getOwnComplaints,
	getOwnComplaint,
	getAllComplaints,
	deleteOwnComplaint,
};
