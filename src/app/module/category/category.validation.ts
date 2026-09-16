import { z } from "zod";

 const createCategorySchema = z
  .object({
    name: z
      .string()
      .min(2, "Category name must be at least 2 characters"),

    description: z.string().optional(),

    status: z.enum(["FREE", "PAID"]).default("FREE"),

    price: z.number().nonnegative().optional(),
  })
  .refine(
    (data) => {
      if (data.status === "PAID") {
        return data.price !== undefined && data.price > 0;
      }

      return data.price === undefined || data.price === 0;
    },
    {
      message: "PAID category must have a price greater than 0",
      path: ["price"],
    },
  );

const updateCategorySchema = z
  .object({
    name: z.string().min(2).optional(),

    description: z.string().optional(),

    status: z.enum(["FREE", "PAID"]).optional(),

    price: z.number().nonnegative().optional(),

    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.status === "PAID") {
        return data.price !== undefined && data.price > 0;
      }

      if (data.status === "FREE") {
        return data.price === undefined || data.price === 0;
      }

      return true;
    },
    {
      message: "PAID category must have a price greater than 0",
      path: ["price"],
    },
  );

export const CategoryValidation = {
  createCategorySchema,
  updateCategorySchema,
};