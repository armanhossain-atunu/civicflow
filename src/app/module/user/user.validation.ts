import z from "zod";
import { Role, UserStatus } from "../../../generated/prisma/enums";

const updateUserStatusSchema = z.object({
  body: z.object({
    status: z.enum(UserStatus),
  }),
});

const updateUserRoleSchema = z.object({
  body: z.object({
    role: z.enum(Role),
  }),
});
export const UserValidation = {
  updateUserStatusSchema,
  updateUserRoleSchema,
};
