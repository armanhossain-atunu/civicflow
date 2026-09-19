import { prisma } from "../../lib/prisma";
import { bkashService } from "./bkash.service";
import type { ICreatePayment } from "./payment.interface";

const createPayment = async (userId: string, payload: ICreatePayment) => {
  // Find complaint
  const complaint = await prisma.complaint.findFirst({
    where: {
      id: payload.complaintId,
      citizenId: userId,
    },

    include: {
      category: true,
      payment: true,
    },
  });

  if (!complaint) {
    throw new Error("Complaint not found");
  }

  // Category must require payment
  if (!complaint.category.paymentRequired) {
    throw new Error("Payment is not required for this complaint");
  }

  // Payment amount must exist
  if (!complaint.paymentAmount) {
    throw new Error("Payment amount is not configured for this complaint");
  }

  // Already paid
  if (complaint.paymentStatus === "PAID") {
    throw new Error("Payment for this complaint is already completed");
  }

  // Existing pending payment
  if (complaint.payment && complaint.payment.status === "PENDING") {
    return {
      payment: complaint.payment,
      bkashURL: null,
      message: "A pending payment already exists",
    };
  }

  const merchantInvoice = `CF-${Date.now()}-${Math.floor(
    Math.random() * 10000,
  )}`;

  // Reuse the one-to-one payment record when retrying a failed attempt.
  const payment = complaint.payment
    ? await prisma.payment.update({
        where: {
          id: complaint.payment.id,
        },
        data: {
          amount: complaint.paymentAmount,
          method: "BKASH",
          status: "PENDING",
          gateway: "BKASH",
          gatewayTransactionId: null,
          transactionId: null,
          paidAt: null,
          failedAt: null,
          failureReason: null,
          initiatedAt: new Date(),
        },
      })
    : await prisma.payment.create({
        data: {
          complaintId: complaint.id,
          citizenId: userId,
          amount: complaint.paymentAmount,
          method: "BKASH",
          status: "PENDING",
          gateway: "BKASH",
        },
      });

  try {
    // Create bKash payment
    const bkashResponse = await bkashService.createPayment({
      amount: complaint.paymentAmount.toString(),
      currency: "BDT",
      intent: "sale",
      merchantInvoiceNumber: merchantInvoice,
      callbackURL: process.env.BKASH_CALLBACK_URL,
    });

    const paymentID = bkashResponse.paymentID || bkashResponse.paymentId;

    const bkashURL = bkashResponse.bkashURL;

    if (!paymentID) {
      await prisma.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: "FAILED",
          failedAt: new Date(),
          failureReason:
            bkashResponse.errorMessage ||
            bkashResponse.statusMessage ||
            bkashResponse.msg ||
            "bKash payment creation failed",
        },
      });

      throw new Error(
        bkashResponse.errorMessage ||
          bkashResponse.statusMessage ||
          bkashResponse.msg ||
          "bKash payment creation failed",
      );
    }

    // Save bKash payment ID
    const updatedPayment = await prisma.payment.update({
      where: {
        id: payment.id,
      },

      data: {
        gatewayTransactionId: paymentID,
      },
    });

    return {
      payment: updatedPayment,
      paymentID,
      bkashURL,
    };
  } catch (error) {
    await prisma.payment.update({
      where: {
        id: payment.id,
      },

      data: {
        status: "FAILED",
        failedAt: new Date(),
        failureReason: error instanceof Error ? error.message : "Unknown error",
      },
    });

    throw error;
  }
};

/**
 * Execute bKash payment
 */
const executePayment = async (userId: string, paymentID: string) => {
  const payment = await prisma.payment.findFirst({
    where: {
      gatewayTransactionId: paymentID,
      citizenId: userId,
    },

    include: {
      complaint: true,
    },
  });

  if (!payment) {
    throw new Error("Payment not found");
  }

  if (payment.status === "PAID") {
    return payment;
  }

  const response = await bkashService.executePayment(paymentID);

  const trxID = response.trxID;

  const transactionStatus = response.transactionStatus;

  /*
   * bKash success response normally contains trxID.
   */
  if (!trxID) {
    await prisma.payment.update({
      where: {
        id: payment.id,
      },

      data: {
        status: "FAILED",
      },
    });

    throw new Error(
      response.errorMessage ||
        response.statusMessage ||
        "bKash payment execution failed",
    );
  }

  // Update payment + complaint atomically
  const result = await prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: {
        id: payment.id,
      },

      data: {
        status: "PAID",
        transactionId: trxID,
        paidAt: new Date(),
      },
    });

    const updatedComplaint = await tx.complaint.update({
      where: {
        id: payment.complaintId,
      },

      data: {
        paymentStatus: "PAID",
        status: "SUBMITTED",
      },
    });

    return {
      payment: updatedPayment,
      complaint: updatedComplaint,
      transactionStatus,
    };
  });

  return result;
};

/**
 * Get own payment
 */
const getOwnPayment = async (userId: string, paymentId: string) => {
  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      citizenId: userId,
    },

    include: {
      complaint: {
        include: {
          category: true,
        },
      },
    },
  });

  if (!payment) {
    throw new Error("Payment not found");
  }

  return payment;
};

/**
 * Get all payments
 */
const getAllPayments = async () => {
  return prisma.payment.findMany({
    include: {
      complaint: {
        include: {
          category: true,
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

    orderBy: {
      createdAt: "desc",
    },
  });
};

export const paymentService = {
  createPayment,
  executePayment,
  getOwnPayment,
  getAllPayments,
};
