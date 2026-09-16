
import { prisma } from "../../lib/prisma";
import { ICreateComplaint } from "./complaint.interface";

const createComplaint = async (
  userId: string,
  payload: ICreateComplaint,
) => {
  const category = await prisma.category.findUnique({
    where: {
      id: payload.categoryId,
    },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  const trackingId = `CF-${Date.now()}`;

  const complaint = await prisma.complaint.create({
    data: {
      trackingId,
      title: payload.title,
      description: payload.description,
      citizenId: userId,
      categoryId: payload.categoryId,
      locationId: payload.locationId,
    },
  });

  return complaint;
};

export const complaintService = {
  createComplaint,
};