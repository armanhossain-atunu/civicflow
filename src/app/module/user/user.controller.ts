import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { UserServices } from "./user.service";

const uploadProfileImage = catchAsync(async (req: Request, res: Response) => {
	if (!req.file) {
		throw new Error("No File Provided.");
	}

	const userId = req.user?.userId;

	const result = await UserServices.uploadProfileImage(
		req.file?.buffer,
		userId!,
	);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "New tokens generated successfully",
		data: result,
	});
});
const getAllUsers = async (req: Request, res: Response) => {
	const result = await UserServices.getAllUsers();

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "All users retrieved successfully",
		data: result,
	});
};

const updateUserStatus = async (req: Request, res: Response) => {
	const result = await UserServices.updateUserStatus(
		req.params.userId as string,
		req.body.status,
	);

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "User status updated successfully",
		data: result,
	});
};

const updateUserRole = async (req: Request, res: Response) => {
	const result = await UserServices.updateUserRole(
		req.params.userId as string,
		req.body.role,
	);

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "User role updated successfully",
		data: result,
	});
};

const deleteUser = async (req: Request, res: Response) => {
	const result = await UserServices.deleteUser(req.params.userId as string);

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "User deleted successfully",
		data: result,
	});
};

export const UserController = {
	uploadProfileImage,
	getAllUsers,
	updateUserStatus,
	updateUserRole,
	deleteUser,
};
