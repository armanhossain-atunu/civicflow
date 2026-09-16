import { Router } from "express";
import { CategoryController } from "./category.controller";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { CategoryValidation } from "./category.validation";
import { validateRequest } from "../../middleware/validateRequest";

const router = Router();

router.post(
  "/",
  auth(Role.ADMIN),
  validateRequest(CategoryValidation.createCategorySchema),
  CategoryController.createCategory,
);

router.get("/", CategoryController.getAllCategories);

router.get("/active", CategoryController.getActiveCategories);

router.get("/:id", CategoryController.getCategoryById);

router.patch(
  "/:id",
  auth(Role.ADMIN),
  validateRequest(CategoryValidation.updateCategorySchema),
  CategoryController.updateCategory,
);

router.delete("/:id", auth(Role.ADMIN), CategoryController.deleteCategory);

export const CategoryRoutes = router;
