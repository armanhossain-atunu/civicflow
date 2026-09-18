import { z } from "zod";

const createComplaintAssignmentSchema = z.object({
  complaintId: z
    .string()
    .uuid("Invalid complaint ID"),

  assignedToId: z
    .string()
    .uuid("Invalid technician ID"),

  note: z
    .string()
    .trim()
    .max(500, "Note cannot exceed 500 characters")
    .optional(),
});

export const ComplaintAssignmentValidation = {
  createComplaintAssignmentSchema,
};