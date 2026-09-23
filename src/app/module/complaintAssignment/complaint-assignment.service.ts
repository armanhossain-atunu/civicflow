import { ComplaintStatus, Role } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type { ICreateComplaintAssignment } from "./complaint-assignment.interface";
import httpStatus from "http-status";

const MAX_ACTIVE_ASSIGNMENTS = 6;

// ======================================================
// CREATE ASSIGNMENT
// Manager/Admin assigns a complaint to a technician
// ======================================================

const createAssignment = async (
	managerId: string,
	payload: ICreateComplaintAssignment,
) => {
	// ------------------------------------------
	// Check complaint
	// ------------------------------------------

	const complaint = await prisma.complaint.findUnique({
		where: {
			id: payload.complaintId,
		},
	});

	if (!complaint) {
		throw new AppError(httpStatus.NOT_FOUND, "Complaint not found");
	}

	// ------------------------------------------
	// Closed complaint cannot be assigned
	// ------------------------------------------

	if (complaint.status === ComplaintStatus.CLOSED) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Closed complaint cannot be assigned",
		);
	}

	// ------------------------------------------
	// Check technician
	// ------------------------------------------

	const technician = await prisma.user.findUnique({
		where: {
			id: payload.assignedToId,
		},
	});

	if (!technician) {
		throw new AppError(httpStatus.NOT_FOUND, "Technician not found");
	}

	// ------------------------------------------
	// Must be technician
	// ------------------------------------------

	if (technician.role !== Role.TECHNICIAN) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Complaint can only be assigned to a technician",
		);
	}

	// ------------------------------------------
	// Technician must be active
	// ------------------------------------------

	if (technician.status !== "ACTIVE") {
		throw new AppError(httpStatus.BAD_REQUEST, "This technician is not active");
	}

	// ------------------------------------------
	// Check technician active assignments
	// Maximum = 6
	// ------------------------------------------

	const activeAssignmentCount = await prisma.complaintAssignment.count({
		where: {
			assignedToId: payload.assignedToId,
			completedAt: null,

			complaint: {
				status: {
					in: [ComplaintStatus.ASSIGNED, ComplaintStatus.IN_PROGRESS],
				},
			},
		},
	});

	if (activeAssignmentCount >= MAX_ACTIVE_ASSIGNMENTS) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"This technician is unavailable. Maximum 6 active complaints are already assigned.",
		);
	}

	// ------------------------------------------
	// Check existing active assignment
	// ------------------------------------------

	const existingAssignment = await prisma.complaintAssignment.findFirst({
		where: {
			complaintId: payload.complaintId,
			completedAt: null,
		},
	});

	if (existingAssignment) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"This complaint is already assigned to a technician",
		);
	}

	// ------------------------------------------
	// Create assignment + update complaint
	// Use transaction
	// ------------------------------------------

	const result = await prisma.$transaction(async (tx) => {
		const assignment = await tx.complaintAssignment.create({
			data: {
				complaint: {
					connect: {
						id: payload.complaintId,
					},
				},

				assignedTo: {
					connect: {
						id: payload.assignedToId,
					},
				},

				assignedBy: {
					connect: {
						id: managerId,
					},
				},

				note: payload.note,
			},

			include: {
				complaint: {
					select: {
						id: true,
						trackingId: true,
						title: true,
						status: true,
						priority: true,
						categoryName: true,
						department: true,
						location: true,
					},
				},

				assignedTo: {
					select: {
						id: true,
						name: true,
						email: true,
						role: true,
						status: true,
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
		});

		// ------------------------------------------
		// Update complaint status
		// ------------------------------------------

		await tx.complaint.update({
			where: {
				id: payload.complaintId,
			},

			data: {
				status: ComplaintStatus.ASSIGNED,
			},
		});

		return assignment;
	});

	return result;
};

// ======================================================
// GET ALL ASSIGNMENTS FOR A COMPLAINT
// Manager/Admin/Technician
// ======================================================

const getComplaintAssignments = async (complaintId: string) => {
	// ------------------------------------------
	// Check complaint
	// ------------------------------------------

	const complaint = await prisma.complaint.findUnique({
		where: {
			id: complaintId,
		},
	});

	if (!complaint) {
		throw new AppError(httpStatus.NOT_FOUND, "Complaint not found");
	}

	// ------------------------------------------
	// Get assignments
	// ------------------------------------------

	return prisma.complaintAssignment.findMany({
		where: {
			complaintId,
		},

		include: {
			assignedTo: {
				select: {
					id: true,
					name: true,
					email: true,
					role: true,
					status: true,
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

			complaint: {
				select: {
					id: true,
					trackingId: true,
					title: true,
					status: true,
					priority: true,
				},
			},
		},

		orderBy: {
			assignedAt: "desc",
		},
	});
};

// ======================================================
// GET MY ACTIVE ASSIGNMENTS
// Technician
// ======================================================

const getMyAssignments = async (technicianId: string) => {
	return prisma.complaintAssignment.findMany({
		where: {
			assignedToId: technicianId,

			// Only active assignments
			completedAt: null,

			complaint: {
				status: {
					in: [ComplaintStatus.ASSIGNED, ComplaintStatus.IN_PROGRESS],
				},
			},
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
					createdAt: true,
				},
			},

			assignedBy: {
				select: {
					id: true,
					name: true,
					role: true,
				},
			},
		},

		orderBy: {
			assignedAt: "desc",
		},
	});
};

// ======================================================
// COMPLETE / UPDATE ASSIGNMENT
//
// Allowed status transitions:
//
// ASSIGNED → IN_PROGRESS
// IN_PROGRESS → RESOLVED
//
// ASSIGNED → IN_PROGRESS:
//   Assignment remains active
//   completedAt = null
//
// IN_PROGRESS → RESOLVED:
//   Assignment completed
//   completedAt = current date
//
// Technician cannot change to CLOSED or any other status
// ======================================================

const completeAssignment = async (
	technicianId: string,
	assignmentId: string,
	payload: {
		status: ComplaintStatus;
	},
) => {
	// ------------------------------------------
	// Find assignment
	// ------------------------------------------

	const assignment = await prisma.complaintAssignment.findUnique({
		where: {
			id: assignmentId,
		},
	});

	if (!assignment) {
		throw new AppError(httpStatus.NOT_FOUND, "Assignment not found");
	}

	// ------------------------------------------
	// Check technician ownership
	// ------------------------------------------

	if (assignment.assignedToId !== technicianId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You are not assigned to this complaint",
		);
	}

	// ------------------------------------------
	// Already completed?
	// ------------------------------------------

	if (assignment.completedAt) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"This assignment is already completed",
		);
	}

	// ------------------------------------------
	// Transaction
	// ------------------------------------------

	const result = await prisma.$transaction(async (tx) => {
		// ----------------------------------------
		// Get latest complaint status
		// inside transaction
		// ----------------------------------------

		const complaint = await tx.complaint.findUnique({
			where: {
				id: assignment.complaintId,
			},

			select: {
				id: true,
				trackingId: true,
				title: true,
				status: true,
				priority: true,
				categoryName: true,
				department: true,
				location: true,
			},
		});

		if (!complaint) {
			throw new AppError(httpStatus.NOT_FOUND, "Complaint not found");
		}

		// ==================================================
		// ASSIGNED → IN_PROGRESS
		// ==================================================

		if (complaint.status === ComplaintStatus.ASSIGNED) {
			// Technician can only move ASSIGNED
			// complaint to IN_PROGRESS

			if (payload.status !== ComplaintStatus.IN_PROGRESS) {
				throw new AppError(
					httpStatus.BAD_REQUEST,
					"Assigned complaint can only be changed to IN_PROGRESS",
				);
			}

			// Update complaint status
			const updatedComplaint = await tx.complaint.update({
				where: {
					id: complaint.id,
				},

				data: {
					status: ComplaintStatus.IN_PROGRESS,
				},

				select: {
					id: true,
					trackingId: true,
					title: true,
					status: true,
					priority: true,
					categoryName: true,
					department: true,
					location: true,
				},
			});

			// IMPORTANT:
			// Assignment is NOT completed here.
			// completedAt remains null.

			return {
				assignment,
				complaint: updatedComplaint,
			};
		}

		// ==================================================
		// IN_PROGRESS → RESOLVED
		// ==================================================

		if (complaint.status === ComplaintStatus.IN_PROGRESS) {
			// Technician can only resolve
			// an IN_PROGRESS complaint

			if (payload.status !== ComplaintStatus.RESOLVED) {
				throw new AppError(
					httpStatus.BAD_REQUEST,
					"IN_PROGRESS complaint can only be changed to RESOLVED",
				);
			}

			// ----------------------------------------
			// Complete assignment
			// ----------------------------------------

			const updatedAssignment = await tx.complaintAssignment.update({
				where: {
					id: assignmentId,
				},

				data: {
					completedAt: new Date(),
				},
			});

			// ----------------------------------------
			// Update complaint
			// IN_PROGRESS → RESOLVED
			// ----------------------------------------

			const updatedComplaint = await tx.complaint.update({
				where: {
					id: complaint.id,
				},

				data: {
					status: ComplaintStatus.RESOLVED,
				},

				select: {
					id: true,
					trackingId: true,
					title: true,
					status: true,
					priority: true,
					categoryName: true,
					department: true,
					location: true,
				},
			});

			return {
				assignment: updatedAssignment,
				complaint: updatedComplaint,
			};
		}

		// ==================================================
		// ALL OTHER STATUS TRANSITIONS ARE BLOCKED
		// ==================================================

		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Only ASSIGNED → IN_PROGRESS → RESOLVED status transition is allowed",
		);
	});

	return result;
};

// ======================================================
// CLOSE COMPLAINT
// ONLY MANAGER / ADMIN
// ======================================================

const closeComplaint = async (complaintId: string) => {
	// ------------------------------------------
	// Find complaint
	// ------------------------------------------

	const complaint = await prisma.complaint.findUnique({
		where: {
			id: complaintId,
		},
	});

	if (!complaint) {
		throw new AppError(httpStatus.NOT_FOUND, "Complaint not found");
	}

	// ------------------------------------------
	// Only RESOLVED complaint can be CLOSED
	// ------------------------------------------

	if (complaint.status !== ComplaintStatus.RESOLVED) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Only resolved complaints can be closed",
		);
	}

	// ------------------------------------------
	// Close complaint
	// ------------------------------------------

	const updatedComplaint = await prisma.complaint.update({
		where: {
			id: complaintId,
		},

		data: {
			status: ComplaintStatus.CLOSED,
		},

		select: {
			id: true,
			trackingId: true,
			title: true,
			status: true,
			priority: true,
			categoryName: true,
			department: true,
			location: true,
		},
	});

	return updatedComplaint;
};

// ======================================================
// EXPORT
// ======================================================

export const ComplaintAssignmentService = {
	createAssignment,
	getComplaintAssignments,
	getMyAssignments,
	completeAssignment,
	closeComplaint,
};
