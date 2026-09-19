import { prisma } from "../../lib/prisma";
import type { ICreateComplaint } from "./complaint.interface";

// Create complaint
// const createComplaint = async (userId: string, payload: ICreateComplaint) => {
//   // Check category
//   const category = await prisma.category.findUnique({
//     where: {
//       id: payload.categoryId,
//     },
//   });

//   if (!category) {
//     throw new Error("Category not found");
//   }

//   // Category must be active
//   if (!category.isActive) {
//     throw new Error("This category is not active");
//   }

//   // Category department and complaint department must match
//   if (category.department !== payload.department) {
//     throw new Error("Selected department does not match the selected category");
//   }

//   // Check duplicate active complaint
//   const existingComplaint = await prisma.complaint.findFirst({
//     where: {
//       citizenId: userId,
//       categoryId: payload.categoryId,
//       categoryName: category.name,
//       department: category.department,
//       location: payload.location,

//       // CLOSED complaint is allowed
//       status: {
//         not: "CLOSED",
//       },

      
//     },
//   });

//   if (existingComplaint) {
//     throw new Error(
//       "You already have an active complaint for this category, department and location",
//     );
//   }

//   const trackingId = `CF-${Date.now()}`;

//   const complaint = await prisma.complaint.create({
//     data: {
//       trackingId,
//       title: payload.title,
//       description: payload.description,

//       citizenId: userId,
//       categoryId: payload.categoryId,

//       // Snapshot from Category
//       categoryName: category.name,
//       department: category.department,
//       location: payload.location,

//       // Prisma defaults
//       // status: SUBMITTED
//       // paymentStatus: NOT_REQUIRED
//     },
//   });

//   return complaint;
// };
const createComplaint = async (
  userId: string,
  payload: ICreateComplaint,
) => {
  // Check category
  const category = await prisma.category.findUnique({
    where: {
      id: payload.categoryId,
    },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  // Category must be active
  if (!category.isActive) {
    throw new Error("This category is not active");
  }

  // Category department and complaint department must match
  if (category.department !== payload.department) {
    throw new Error(
      "Selected department does not match the selected category",
    );
  }

  // Paid category must have payment amount
  if (category.paymentRequired && !category.paymentAmount) {
    throw new Error("Payment amount is not configured for this category");
  }

  // Free category should not have payment amount
  if (!category.paymentRequired && category.paymentAmount) {
    throw new Error("Invalid payment configuration for this category");
  }

  // Check duplicate active complaint
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

      // isDeleted: false,
    },
  });

  if (existingComplaint) {
    throw new Error(
      "You already have an active complaint for this category, department and location",
    );
  }

  const trackingId = `CF-${Date.now()}`;

  const complaint = await prisma.complaint.create({
    data: {
      trackingId,
      title: payload.title,
      description: payload.description,

      citizenId: userId,
      categoryId: payload.categoryId,

      // Snapshot from Category
      categoryName: category.name,
      department: category.department,
      location: payload.location,

      // Payment configuration
      paymentAmount: category.paymentRequired
        ? category.paymentAmount
        : null,

      paymentStatus: category.paymentRequired
        ? "PENDING"
        : "NOT_REQUIRED",

      // Complaint status
      status: category.paymentRequired
        ? "PAYMENT_PENDING"
        : "SUBMITTED",
    },
  });

  return complaint;
};
// Get own complaints
const getOwnComplaints = async (userId: string) => {
  const complaints = await prisma.complaint.findMany({
    where: {
      citizenId: userId,
    },
    include: {
      category: true,
      payment: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return complaints;
};
// Delete own complaint
const deleteOwnComplaint = async (userId: string, complaintId: string) => {
  const complaint = await prisma.complaint.findFirst({
    where: {
      id: complaintId,
      citizenId: userId,
      isDeleted: false,
    },
  });

  if (!complaint) {
    throw new Error("Complaint not found");
  }

  // Only allow deletion before processing starts
  if (
    complaint.status !== "SUBMITTED" &&
    complaint.status !== "PAYMENT_PENDING"
  ) {
    throw new Error("Complaint cannot be deleted after processing has started");
  }

  await prisma.complaint.update({
    where: {
      id: complaintId,
    },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
};
const getAllComplaints = async () => {
  return prisma.complaint.findMany({
   
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

    orderBy: {
      createdAt: "desc",
    },
  });
};
export const complaintService = {
  createComplaint,
  getOwnComplaints,
  getAllComplaints,
  deleteOwnComplaint,
};
