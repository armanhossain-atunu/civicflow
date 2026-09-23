import type { NextFunction, Request, Response } from "express";
import type { JwtPayload } from "jsonwebtoken";

import config from "../config";
import { prisma } from "../lib/prisma";
import { catchAsync } from "../utils/catchAsync";
import { jwtUtils } from "../utils/jwt";
import type { Role } from "../../generated/prisma/enums";

declare global {
	namespace Express {
		interface Request {
			user?: {
				email: string;
				name: string;
				userId: string;
				role: Role;
			};
		}
	}
}

export const auth = (...requiredRoles: Role[]) => {
	return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
		const authError = (message: string, statusCode: number) => {
			const error = new Error(message) as Error & { statusCode: number };
			error.statusCode = statusCode;
			return error;
		};

		const token = req.cookies.accessToken
			? req.cookies.accessToken
			: req.headers.authorization?.startsWith("Bearer ")
				? req.headers.authorization?.split(" ")[1]
				: req.headers.authorization;

		if (!token) {
			throw authError(
				"You are not logged in. Please log in to access this resource.",
				401,
			);
		}

		const verifiedToken = jwtUtils.verifyToken(token, config.jwt_access_secret);

		if (!verifiedToken.success) {
			throw authError(verifiedToken.error, 401);
		}

		const { email, name, userId, role } = verifiedToken.data as JwtPayload;

		if (requiredRoles.length && !requiredRoles.includes(role)) {
			throw authError(
				"Forbidden. You don't have permission to access this resource.",
				403,
			);
		}

		const user = await prisma.user.findUnique({
			where: {
				id: userId,
				email,
				name,
				role,
			},
		});

		if (!user) {
			throw authError("User not found. Please log in again.", 401);
		}

		if (user.status === "BLOCKED") {
			throw authError(
				"Your account has been blocked. Please contact support.",
				403,
			);
		}

		req.user = {
			email,
			name,
			userId,
			role,
		};

		next();
	});
};
