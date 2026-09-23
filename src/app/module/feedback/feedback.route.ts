import { Router } from "express";

import { Role } from "../../../generated/prisma/enums";

import { validateRequest } from "../../middleware/validateRequest";

import {
	createFeedbackSchema,
	updateFeedbackSchema,
	feedbackQuerySchema,
} from "./feedback.validation";

import { feedbackController } from "./feedback.controller";
import { auth } from "../../middleware/checkAuth";

const router = Router();

// =====================================================
// CITIZEN
// =====================================================

// Create feedback
router.post(
	"/",
	auth(Role.CITIZEN),
	validateRequest(createFeedbackSchema),
	feedbackController.createFeedback,
);

// Get own feedbacks
router.get(
	"/my-feedbacks",
	auth(Role.CITIZEN),
	validateRequest(feedbackQuerySchema),
	feedbackController.getOwnFeedbacks,
);

// Get own/single feedback
router.get(
	"/:id",
	auth(Role.CITIZEN, Role.ADMIN, Role.MANAGER),
	feedbackController.getFeedbackById,
);

// Update own feedback
router.patch(
	"/:id",
	auth(Role.CITIZEN),
	validateRequest(updateFeedbackSchema),
	feedbackController.updateFeedback,
);

// Delete own feedback
router.delete("/:id", auth(Role.CITIZEN), feedbackController.deleteFeedback);

// =====================================================
// ADMIN / MANAGER
// =====================================================

// Get all feedbacks
router.get(
	"/",

	validateRequest(feedbackQuerySchema),
	feedbackController.getAllFeedbacks,
);

export const feedbackRoutes = router;
