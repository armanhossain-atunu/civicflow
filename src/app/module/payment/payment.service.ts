import httpStatus from "http-status";
import config from "../../config";
import { getBkashIdToken } from "../../lib/bkash";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";

type BkashResponse = {
	paymentID?: string;
	bkashURL?: string;
	merchantInvoiceNumber?: string;
	statusCode?: string;
	statusMessage?: string;
	transactionStatus?: string;
	trxID?: string;
};

const callBkash = async (
	path: string,
	method: "POST",
	token: string,
	body?: Record<string, string>,
) => {
	const response = await fetch(`${config.bkash_base_url}${path}`, {
		method,
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			authorization: token,
			"x-app-key": config.bkash_app_key,
		},
		body: body ? JSON.stringify(body) : undefined,
	});

	const result = (await response.json()) as BkashResponse;
	if (!response.ok || result.statusCode !== "0000") {
		throw new AppError(httpStatus.BAD_GATEWAY, "Bkash payment request failed");
	}

	return result;
};

const createBkashPayment = async (userId: string, complaintId: string) => {
	const payment = await prisma.payment.findFirst({
		where: {
			complaintId,
			citizenId: userId,
			status: "PENDING",
		},
		include: { complaint: true },
	});

	if (!payment) {
		throw new AppError(httpStatus.NOT_FOUND, "Pending payment not found");
	}

	const token = await getBkashIdToken();
	if (!token) {
		throw new AppError(
			httpStatus.BAD_GATEWAY,
			"Bkash access token is unavailable",
		);
	}
	const merchantInvoiceNumber = `CF-${payment.complaint.trackingId}-${Date.now()}`;
	const result = await callBkash("/tokenized/checkout/create", "POST", token, {
		mode: "0011",
		payerReference: userId,
		callbackURL: config.bkash_callback_url,
		amount: payment.amount.toString(),
		currency: "BDT",
		intent: "sale",
		merchantInvoiceNumber,
	});

	if (!result.paymentID || !result.bkashURL) {
		throw new AppError(
			httpStatus.BAD_GATEWAY,
			"Invalid Bkash payment response",
		);
	}

	await prisma.payment.update({
		where: { id: payment.id },
		data: {
			gateway: "BKASH",
			gatewayTransactionId: result.paymentID,
			merchantInvoice: merchantInvoiceNumber,
		},
	});

	return {
		paymentId: result.paymentID,
		paymentUrl: result.bkashURL,
		merchantInvoiceNumber,
	};
};
// Execute Bkash payment
const executeBkashPayment = async (paymentId: string, userId?: string) => {
	const payment = await prisma.payment.findFirst({
		where: {
			gatewayTransactionId: paymentId,
			...(userId ? { citizenId: userId } : {}),
		},
	});

	if (!payment) {
		throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
	}

	if (payment.status === "PAID") {
		return payment;
	}

	const token = await getBkashIdToken();
	if (!token) {
		throw new AppError(
			httpStatus.BAD_GATEWAY,
			"Bkash access token is unavailable",
		);
	}
	const result = await callBkash("/tokenized/checkout/execute", "POST", token, {
		paymentID: paymentId,
	});

	if (result.transactionStatus !== "Completed" || !result.trxID) {
		await prisma.payment.update({
			where: { id: payment.id },
			data: {
				gatewayTransactionId: result.paymentID,
				status: "FAILED",
				failedAt: new Date(),
				failureReason: "Bkash payment was not completed",
			},
		});
		throw new AppError(
			httpStatus.BAD_GATEWAY,
			"Bkash payment was not completed",
		);
	}

	return prisma.$transaction(async (tx) => {
		const paidPayment = await tx.payment.update({
			where: { id: payment.id },
			data: {
				status: "PAID",
				transactionId: result.trxID,
				paidAt: new Date(),
			},
		});

		await tx.complaint.update({
			where: { id: payment.complaintId },
			data: {
				paymentStatus: "PAID",
				status: "SUBMITTED",
			},
		});

		return paidPayment;
	});
};
// Get my payments
const getMyPayments = async (userId: string) => {
	return prisma.payment.findMany({
		where: {
			citizenId: userId,
		},
		include: {
			complaint: {
				select: {
					id: true,
					trackingId: true,
					title: true,
					status: true,
					paymentStatus: true,
				},
			},
		},
		orderBy: {
			createdAt: "desc",
		},
	});
};
// Get all payments by admin and manager
const getAllPayments = async () => {
	return prisma.payment.findMany({
		include: {
			citizen: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
			complaint: {
				select: {
					id: true,
					trackingId: true,
					title: true,
					status: true,
					paymentStatus: true,
				},
			},
		},
		orderBy: {
			createdAt: "desc",
		},
	});
};
export const paymentService = {
	createBkashPayment,
	executeBkashPayment,
	getMyPayments,
	getAllPayments,
};
