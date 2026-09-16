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
  // create category
  const category = await prisma.category.create({
    data: {
      name: payload.name,
      description: payload.description,
      status: payload.status ?? "FREE",
      price: payload.price,
    },
  });

  return category;
};
// get all categories
const getAllCategories = async () => {
  const categories = await prisma.category.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return categories;
};
// get active categories
const getActiveCategories = async () => {
  const categories = await prisma.category.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return categories;
};
// get category by id
const getCategoryById = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: {
      id,
    },
    include: {
      complaints: true,
    },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  return category;
};

const updateCategory = async (id: string, payload: IUpdateCategory) => {
  const existingCategory = await prisma.category.findUnique({
    where: {
      id,
    },
  });

  if (!existingCategory) {
    throw new Error("Category not found");
  }

  if (payload.name && payload.name !== existingCategory.name) {
    const duplicateCategory = await prisma.category.findUnique({
      where: {
        name: payload.name,
      },
    });

    if (duplicateCategory) {
      throw new Error("Category with this name already exists");
    }
  }

  const category = await prisma.category.update({
    where: {
      id,
    },
    data: {
      name: payload.name,
      description: payload.description,
      status: payload.status,
      price: payload.price,
      isActive: payload.isActive,
    },
  });

  return category;
};

const deleteCategory = async (id: string) => {
  const existingCategory = await prisma.category.findUnique({
    where: {
      id,
    },
  });

  if (!existingCategory) {
    throw new Error("Category not found");
  }

  const category = await prisma.category.update({
    where: {
      id,
    },
    data: {
      isActive: false,
    },
  });

  return category;
};

export const CategoryService = {
  createCategory,
  getAllCategories,
  getActiveCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
