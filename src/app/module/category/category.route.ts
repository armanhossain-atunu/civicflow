import { Router } from "express";
import { CategoryController } from "./category.controller";

const router = Router();

router.post("/", CategoryController.createCategory);

router.get("/", CategoryController.getAllCategories);

router.get("/active", CategoryController.getActiveCategories);

router.get("/:id", CategoryController.getCategoryById);

router.patch("/:id", CategoryController.updateCategory);

router.delete("/:id", CategoryController.deleteCategory);

export const CategoryRoutes = router;