import { z } from "zod";

export const createFeedbackSchema = z.object({
	body: z.object({
		rating: z
			.number()
			.int("Rating must be an integer")
			.min(1, "Rating must be at least 1")
			.max(5, "Rating cannot be greater than 5"),

		comment: z
			.string()
			.trim()
			.max(1000, "Comment cannot exceed 1000 characters")
			.optional(),

		complaintId: z.string().uuid("Invalid complaint ID"),
	}),
});

export const updateFeedbackSchema = z.object({
	body: z.object({
		rating: z
			.number()
			.int("Rating must be an integer")
			.min(1, "Rating must be at least 1")
			.max(5, "Rating cannot be greater than 5")
			.optional(),

		comment: z
			.string()
			.trim()
			.max(1000, "Comment cannot exceed 1000 characters")
			.optional(),
	}),
});

export const feedbackQuerySchema = z.object({
	query: z.object({
		page: z.coerce.number().int().min(1).optional(),
		limit: z.coerce.number().int().min(1).max(100).optional(),
		rating: z.coerce.number().int().min(1).max(5).optional(),
		search: z.string().trim().optional(),
		sortBy: z.enum(["createdAt", "rating"]).optional(),

		sortOrder: z.enum(["asc", "desc"]).optional(),
	}),
});
