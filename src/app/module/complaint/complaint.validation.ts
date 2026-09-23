import { z } from "zod";

export const createComplaintSchema = z.object({
	body: z.object({
		title: z.string().trim().min(5, "Title must be at least 5 characters"),

		description: z
			.string()
			.trim()
			.min(10, "Description must be at least 10 characters"),

		categoryId: z.string().uuid("Invalid category ID"),

		department: z.string().trim().min(2, "Department is required"),

		location: z.string().trim().min(1, "Location is required"),
	}),
});
