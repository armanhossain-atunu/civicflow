import { z } from "zod";

const createCategorySchema = z
  .object({
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
  })
  .refine(
    (data) => {
      if (data.paymentRequired) {
        return data.paymentAmount !== undefined && data.paymentAmount > 0;
      }

      return data.paymentAmount === undefined || data.paymentAmount === 0;
    },
    {
      message: "Paid category must have a payment amount greater than 0",
      path: ["paymentAmount"],
    },
  );

const updateCategorySchema = z
  .object({
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
  })
  .refine(
    (data) => {
      if (data.paymentRequired === true) {
        return data.paymentAmount !== undefined && data.paymentAmount > 0;
      }

      if (data.paymentRequired === false) {
        return data.paymentAmount === undefined || data.paymentAmount === 0;
      }

      return true;
    },
    {
      message: "Paid category must have a payment amount greater than 0",
      path: ["paymentAmount"],
    },
  );

export const CategoryValidation = {
  createCategorySchema,
  updateCategorySchema,
};

