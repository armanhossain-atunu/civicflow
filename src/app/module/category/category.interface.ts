import { categoryStatus } from "../../../generated/prisma/enums";

export interface ICreateCategory {
  name: string;
  status: categoryStatus,
  price?: number;
  description?: string;
}

export interface IUpdateCategory {
  name?: string;
  status?: categoryStatus,
  price?: number;
  description?: string;
  isActive?: boolean;
}