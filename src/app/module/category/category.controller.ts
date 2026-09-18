import type { Request, Response } from "express";

import { CategoryService } from "./category.service";

// Create category
const createCategory = async (req: Request, res: Response) => {
  const result = await CategoryService.createCategory(req.body);

  res.status(201).json({
    success: true,
    message: "Category created successfully",
    data: result,
  });
};

// Get all categories
const getAllCategories = async (req: Request, res: Response) => {
  const result = await CategoryService.getAllCategories();

  res.status(200).json({
    success: true,
    message: "Categories retrieved successfully",
    data: result,
  });
};

// Get active categories
const getActiveCategories = async (req: Request, res: Response) => {
  const result = await CategoryService.getActiveCategories();

  res.status(200).json({
    success: true,
    message: "Active categories retrieved successfully",
    data: result,
  });
};

// Get category by ID
const getCategoryById = async (req: Request, res: Response) => {
  const result = await CategoryService.getCategoryById(req.params.id as string);

  res.status(200).json({
    success: true,
    message: "Category retrieved successfully",
    data: result,
  });
};

// Update category
const updateCategory = async (req: Request, res: Response) => {
  const result = await CategoryService.updateCategory(
    req.params.id as string,
    req.body,
  );

  res.status(200).json({
    success: true,
    message: "Category updated successfully",
    data: result,
  });
};

// Deactivate category
const deleteCategory = async (req: Request, res: Response) => {
  const result = await CategoryService.deleteCategory(
    req.params.id as string,
  );

  res.status(200).json({
    success: true,
    message: "Category deactivated successfully",
    data: result,
  });
};

export const CategoryController = {
  createCategory,
  getAllCategories,
  getActiveCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};