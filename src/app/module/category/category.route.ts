import { Router } from "express";
import { CategoryController } from "./category.controller";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post("/", auth(Role.ADMIN), CategoryController.createCategory);

router.get("/", CategoryController.getAllCategories);

router.get("/active", CategoryController.getActiveCategories);

router.get("/:id", CategoryController.getCategoryById);

router.patch("/:id", CategoryController.updateCategory);

router.delete("/:id", CategoryController.deleteCategory);

export const CategoryRoutes = router;