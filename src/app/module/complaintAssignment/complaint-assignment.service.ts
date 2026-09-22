import { ComplaintStatus, Role } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import type { ICreateComplaintAssignment } from "./complaint-assignment.interface";

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
    throw new Error("Complaint not found");
  }

  // ------------------------------------------
  // Closed complaint cannot be assigned
  // ------------------------------------------

  if (complaint.status === ComplaintStatus.CLOSED) {
    throw new Error("Closed complaint cannot be assigned");
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
    throw new Error("Technician not found");
  }

  // ------------------------------------------
  // Must be technician
  // ------------------------------------------

  if (technician.role !== Role.TECHNICIAN) {
    throw new Error(
      "Complaint can only be assigned to a technician",
    );
  }

  // ------------------------------------------
  // Technician must be active
  // ------------------------------------------

  if (technician.status !== "ACTIVE") {
    throw new Error("This technician is not active");
  }

  // ------------------------------------------
  // Check technician active assignments
  // Maximum = 6
  // ------------------------------------------

  const activeAssignmentCount =
    await prisma.complaintAssignment.count({
      where: {
        assignedToId: payload.assignedToId,
        completedAt: null,

        complaint: {
          isDeleted: false,
          status: {
            in: [
              ComplaintStatus.ASSIGNED,
              ComplaintStatus.IN_PROGRESS,
            ],
          },
        },
      },
    });

  if (activeAssignmentCount >= MAX_ACTIVE_ASSIGNMENTS) {
    throw new Error(
      "This technician is unavailable. Maximum 6 active complaints are already assigned.",
    );
  }

  // ------------------------------------------
  // Check existing active assignment
  // ------------------------------------------

  const existingAssignment =
    await prisma.complaintAssignment.findFirst({
      where: {
        complaintId: payload.complaintId,
        completedAt: null,
      },
    });

  if (existingAssignment) {
    throw new Error(
      "This complaint is already assigned to a technician",
    );
  }

  // ------------------------------------------
  // Create assignment + update complaint
  // Use transaction
  // ------------------------------------------

  const result = await prisma.$transaction(async (tx) => {
    const assignment =
      await tx.complaintAssignment.create({
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
// Manager/Admin/Technician can use according to route
// ======================================================

const getComplaintAssignments = async (
  complaintId: string,
) => {
  // ------------------------------------------
  // Check complaint
  // ------------------------------------------

  const complaint = await prisma.complaint.findUnique({
    where: {
      id: complaintId,
    },
  });

  if (!complaint) {
    throw new Error("Complaint not found");
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

const getMyAssignments = async (
  technicianId: string,
) => {
  return prisma.complaintAssignment.findMany({
    where: {
      assignedToId: technicianId,

      // Only active assignments
      completedAt: null,

      complaint: {
        isDeleted: false,

        status: {
          in: [
            ComplaintStatus.ASSIGNED,
            ComplaintStatus.IN_PROGRESS,
          ],
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
// COMPLETE ASSIGNMENT
// Technician can ONLY RESOLVE
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

  const assignment =
    await prisma.complaintAssignment.findUnique({
      where: {
        id: assignmentId,
      },
    });

  if (!assignment) {
    throw new Error("Assignment not found");
  }

  // ------------------------------------------
  // Check technician ownership
  // ------------------------------------------

  if (assignment.assignedToId !== technicianId) {
    throw new Error(
      "You are not assigned to this complaint",
    );
  }

  // ------------------------------------------
  // Already completed?
  // ------------------------------------------

  if (assignment.completedAt) {
    throw new Error(
      "This assignment is already completed",
    );
  }

  // ------------------------------------------
  // Technician can ONLY resolve
  // Technician cannot CLOSE
  // ------------------------------------------

  if (payload.status !== ComplaintStatus.RESOLVED) {
    throw new Error(
      "Technician can only resolve the complaint",
    );
  }

  // ------------------------------------------
  // Check complaint
  // ------------------------------------------

  const complaint = await prisma.complaint.findUnique({
    where: {
      id: assignment.complaintId,
    },
  });

  if (!complaint) {
    throw new Error("Complaint not found");
  }

  // ------------------------------------------
  // Complaint must be IN_PROGRESS
  // before RESOLVED
  // ------------------------------------------

  if (
    complaint.status !== ComplaintStatus.IN_PROGRESS &&
    complaint.status !== ComplaintStatus.ASSIGNED
  ) {
    throw new Error(
      "Only assigned or in-progress complaints can be resolved",
    );
  }

  // ------------------------------------------
  // Transaction
  // ------------------------------------------

  const result = await prisma.$transaction(async (tx) => {
    // ----------------------------------------
    // Complete assignment
    // ----------------------------------------

    const updatedAssignment =
      await tx.complaintAssignment.update({
        where: {
          id: assignmentId,
        },

        data: {
          completedAt: new Date(),
        },
      });

    // ----------------------------------------
    // Update complaint → RESOLVED
    // ----------------------------------------

    const updatedComplaint =
      await tx.complaint.update({
        where: {
          id: assignment.complaintId,
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
  });

  return result;
};

// ======================================================
// CLOSE COMPLAINT
// ONLY MANAGER / ADMIN
// ======================================================

const closeComplaint = async (
  complaintId: string,
) => {
  // ------------------------------------------
  // Find complaint
  // ------------------------------------------

  const complaint = await prisma.complaint.findUnique({
    where: {
      id: complaintId,
    },
  });

  if (!complaint) {
    throw new Error("Complaint not found");
  }

  // ------------------------------------------
  // Only RESOLVED complaint can be CLOSED
  // ------------------------------------------

  if (complaint.status !== ComplaintStatus.RESOLVED) {
    throw new Error(
      "Only resolved complaints can be closed",
    );
  }

  // ------------------------------------------
  // Close complaint
  // ------------------------------------------

  const updatedComplaint =
    await prisma.complaint.update({
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