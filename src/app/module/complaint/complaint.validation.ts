import { z } from "zod";

export const createComplaintSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),

  description: z.string().min(10, "Description must be at least 10 characters"),

  categoryId: z.string().uuid("Invalid category ID"),

  locationId: z.string().uuid("Invalid location ID").optional(),
});
