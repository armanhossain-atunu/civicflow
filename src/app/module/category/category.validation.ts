import { z } from "zod";

const createCategorySchema = z
	.object({
		body: z.object({
			name: z
				.string()
				.trim()
				.min(2, "Category name must be at least 2 characters"),

			description: z.string().trim().optional(),

			department: z
				.string()
				.trim()
				.min(2, "Department name must be at least 2 characters"),

			isActive: z.boolean().default(true),

			paymentRequired: z.boolean().default(false),

			paymentAmount: z.number().nonnegative().optional(),
		}),
	})
	.refine(
		(data) => {
			if (data.body.paymentRequired) {
				return (
					data.body.paymentAmount !== undefined && data.body.paymentAmount > 0
				);
			}

			return (
				data.body.paymentAmount === undefined || data.body.paymentAmount === 0
			);
		},
		{
			message: "Paid category must have a payment amount greater than 0",
			path: ["body", "paymentAmount"],
		},
	);

const updateCategorySchema = z
	.object({
		body: z.object({
			name: z
				.string()
				.trim()
				.min(2, "Category name must be at least 2 characters")
				.optional(),

			description: z.string().trim().optional(),

			department: z
				.string()
				.trim()
				.min(2, "Department name must be at least 2 characters")
				.optional(),

			isActive: z.boolean().optional(),

			paymentRequired: z.boolean().optional(),

			paymentAmount: z.number().nonnegative().optional(),
		}),
	})
	.refine(
		(data) => {
			if (data.body.paymentRequired === true) {
				return (
					data.body.paymentAmount !== undefined && data.body.paymentAmount > 0
				);
			}

			if (data.body.paymentRequired === false) {
				return (
					data.body.paymentAmount === undefined || data.body.paymentAmount === 0
				);
			}

			return true;
		},
		{
			message: "Paid category must have a payment amount greater than 0",
			path: ["body", "paymentAmount"],
		},
	);

export const CategoryValidation = {
	createCategorySchema,
	updateCategorySchema,
};
