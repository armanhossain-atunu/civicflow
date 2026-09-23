import type { UploadApiResponse } from "cloudinary";
import { cloudinary } from "../../lib/cloudinary";
import { prisma } from "../../lib/prisma";
import type { Role, UserStatus } from "../../../generated/prisma/enums";
import { AppError } from "../../utils/AppError";
import httpStatus from "http-status";

const uploadProfileImage = async (buffer: Buffer, userId: string) => {
	const currentUser = await prisma.user.findUnique({
		where: {
			id: userId,
		},
		select: {
			imagePublicId: true,
			imageUrl: true,
		},
	});

	const cloudinaryResult = await new Promise<UploadApiResponse>(
		(resolve, reject) => {
			cloudinary.uploader
				.upload_stream(
					{
						resource_type: "auto",
					},

					async (error, result) => {
						if (error) {
							return reject(error);
						}

						if (!result) {
							return reject(new Error("No result returned from Cloudinary"));
						}

						resolve(result);
					},
				)
				.end(buffer);
		},
	);

	const updatedUser = await prisma.user.update({
		where: {
			id: userId,
		},

		data: {
			imageUrl: cloudinaryResult.secure_url,
			imagePublicId: cloudinaryResult.public_id,
		},

		omit: {
			password: true,
		},
	});

	if (currentUser?.imagePublicId && currentUser.imageUrl) {
		await cloudinary.uploader.destroy(currentUser.imagePublicId);
	}

	return updatedUser;
};
const getAllUsers = async () => {
	return prisma.user.findMany({
		select: {
			id: true,
			name: true,
			email: true,
			role: true,
			status: true,
			authProvider: true,
			emailVerified: true,
			imageUrl: true,
			createdAt: true,
			updatedAt: true,
		},
		orderBy: {
			createdAt: "desc",
		},
	});
};
const updateUserStatus = async (userId: string, status: UserStatus) => {
	const user = await prisma.user.findUnique({
		where: {
			id: userId,
		},
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found");
	}

	if (user.isDeleted) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Deleted user cannot be updated",
		);
	}

	const updatedUser = await prisma.user.update({
		where: {
			id: userId,
		},
		data: {
			status,
		},
		select: {
			id: true,
			name: true,
			email: true,
			role: true,
			status: true,
			authProvider: true,
			emailVerified: true,
			imageUrl: true,
			createdAt: true,
			updatedAt: true,
		},
	});

	return updatedUser;
};

const updateUserRole = async (userId: string, role: Role) => {
	const user = await prisma.user.findUnique({
		where: {
			id: userId,
		},
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found");
	}

	if (user.isDeleted) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Deleted user role cannot be changed",
		);
	}

	const updatedUser = await prisma.user.update({
		where: {
			id: userId,
		},
		data: {
			role,
		},
		select: {
			id: true,
			name: true,
			email: true,
			role: true,
			status: true,
			authProvider: true,
			emailVerified: true,
			imageUrl: true,
			createdAt: true,
			updatedAt: true,
		},
	});

	return updatedUser;
};

// Delete user
const deleteUser = async (userId: string) => {
	const user = await prisma.user.findUnique({
		where: {
			id: userId,
		},
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found");
	}

	await prisma.user.delete({
		where: {
			id: userId,
		},
	});

	return {
		id: userId,
		message: "User deleted successfully",
	};
};
export const UserServices = {
	uploadProfileImage,
	getAllUsers,
	updateUserStatus,
	updateUserRole,
	deleteUser,
};
