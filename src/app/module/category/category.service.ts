import { prisma } from "../../lib/prisma";

import type { ICreateCategory, IUpdateCategory } from "./category.interface";

// Create category
const createCategory = async (payload: ICreateCategory) => {
	const existingCategory = await prisma.category.findUnique({
		where: {
			name: payload.name,
		},
	});

	if (existingCategory) {
		throw new Error("Category already exists");
	}

	const category = await prisma.category.create({
		data: {
			name: payload.name,
			description: payload.description,
			department: payload.department,
			isActive: payload.isActive ?? true,
			paymentRequired: payload.paymentRequired ?? false,
			paymentAmount: payload.paymentRequired ? payload.paymentAmount : null,
		},
	});

	return category;
};

// Get all categories
const getAllCategories = async () => {
	const categories = await prisma.category.findMany({
		orderBy: {
			createdAt: "desc",
		},
	});

	return categories;
};

// Get active categories
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

// Get category by ID
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

// Update category
const updateCategory = async (id: string, payload: IUpdateCategory) => {
	const existingCategory = await prisma.category.findUnique({
		where: {
			id,
		},
	});

	if (!existingCategory) {
		throw new Error("Category not found");
	}

	// Check duplicate category name
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

	const paymentRequired =
		payload.paymentRequired ?? existingCategory.paymentRequired;

	const category = await prisma.category.update({
		where: {
			id,
		},
		data: {
			name: payload.name,
			description: payload.description,
			isActive: payload.isActive,

			paymentRequired,

			paymentAmount: paymentRequired
				? (payload.paymentAmount ?? existingCategory.paymentAmount)
				: null,
		},
	});

	return category;
};

// Soft delete category
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
