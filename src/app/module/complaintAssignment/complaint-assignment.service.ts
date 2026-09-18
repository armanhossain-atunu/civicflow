import { prisma } from "../../lib/prisma";
import type { ICreateComplaintAssignment } from "./complaint-assignment.interface";

const createAssignment = async (
  managerId: string,
  payload: ICreateComplaintAssignment,
) => {
  // Check complaint
  const complaint = await prisma.complaint.findUnique({
    where: {
      id: payload.complaintId,
    },
  });

  if (!complaint) {
    throw new Error("Complaint not found");
  }

  // Complaint already closed
  if (complaint.status === "CLOSED") {
    throw new Error("Closed complaint cannot be assigned");
  }

  // Check technician
  const technician = await prisma.user.findUnique({
    where: {
      id: payload.assignedToId,
    },
  });

  if (!technician) {
    throw new Error("Technician not found");
  }

  // Must be technician
  if (technician.role !== "TECHNICIAN") {
    throw new Error("Complaint can only be assigned to a technician");
  }

  // Technician must be active
  if (technician.status !== "ACTIVE") {
    throw new Error("This technician is not active");
  }

  // Check existing active assignment
  const existingAssignment = await prisma.complaintAssignment.findFirst({
    where: {
      complaintId: payload.complaintId,
      completedAt: null,
    },
  });

  if (existingAssignment) {
    throw new Error("This complaint is already assigned to a technician");
  }

  // Create assignment
  const assignment = await prisma.complaintAssignment.create({
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

  // Update complaint status
  await prisma.complaint.update({
    where: {
      id: payload.complaintId,
    },
    data: {
      status: "ASSIGNED",
    },
  });

  return assignment;
};
const getComplaintAssignments = async (complaintId: string) => {
  const complaint = await prisma.complaint.findUnique({
    where: {
      id: complaintId,
    },
  });

  if (!complaint) {
    throw new Error("Complaint not found");
  }

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
    },

    orderBy: {
      assignedAt: "desc",
    },
  });
};
const getMyAssignments = async (technicianId: string) => {
  return prisma.complaintAssignment.findMany({
    where: {
      assignedToId: technicianId,
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

const completeAssignment = async (
  technicianId: string,
  assignmentId: string,
) => {
  const assignment = await prisma.complaintAssignment.findUnique({
    where: {
      id: assignmentId,
    },
  });

  if (!assignment) {
    throw new Error("Assignment not found");
  }

  if (assignment.assignedToId !== technicianId) {
    throw new Error("You are not assigned to this complaint");
  }

  if (assignment.completedAt) {
    throw new Error("This assignment is already completed");
  }

  const result = await prisma.complaintAssignment.update({
    where: {
      id: assignmentId,
    },

    data: {
      completedAt: new Date(),
    },
  });

  return result;
};
export const ComplaintAssignmentService = {
  createAssignment,
  getComplaintAssignments,
  getMyAssignments,
  completeAssignment,
};
