
import { prisma } from "../../lib/prisma";
import type { ICreateCategory, IUpdateCategory } from "./category.interface";

const createCategory = async (payload: ICreateCategory) => {
  const existingCategory = await prisma.category.findUnique({
    where: {
      name: payload.name,
    },
  });

  if (existingCategory) {
    throw new Error("Category already exists");
  }

  return prisma.category.create({
    data: {
      name: payload.name,
      description: payload.description,
    },
  });
};

const getAllCategories = async () => {
  return prisma.category.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
};

const getActiveCategories = async () => {
  return prisma.category.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
  });
};

const getCategoryById = async (id: string) => {
  return prisma.category.findUnique({
    where: {
      id,
    },
    include: {
      complaints: true,
    },
  });
};

const updateCategory = async (
  id: string,
  payload: IUpdateCategory,
) => {
  return prisma.category.update({
    where: {
      id,
    },
    data: payload,
  });
};

const deleteCategory = async (id: string) => {
  return prisma.category.update({
    where: {
      id,
    },
    data: {
      isActive: false,
    },
  });
};

export const CategoryService = {
  createCategory,
  getAllCategories,
  getActiveCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};