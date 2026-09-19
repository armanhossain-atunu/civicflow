/** biome-ignore-all lint/correctness/noUnreachable: <explanation> */

import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import config from "./app/config";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";
import { AuthRoutes } from "./app/module/auth/auth.route";
import { UserRoutes } from "./app/module/user/user.route";
import { complaintRouter } from "./app/module/complaint/complaint.route";
import { CategoryRoutes } from "./app/module/category/category.route";
import { ComplaintAssignmentRoutes } from "./app/module/complaintAssignment/complaint-assignment.route";
import { getBkashIdToken } from "./app/lib/bkash";

const app: Application = express();
app.use(
  cors({
    origin: config.frontend_url,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/api/v1/auth", AuthRoutes);
app.use("/api/v1/user", UserRoutes);
app.use("/api/v1/complaint", complaintRouter);
app.use("/api/v1/categories", CategoryRoutes);
app.use("/api/v1/complaint-assignments", ComplaintAssignmentRoutes);


app.get("/test", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const grantIdTokenResult = await getBkashIdToken();
    console.log(grantIdTokenResult);
    res.status(httpStatus.OK).json({
      success: true,
      message: "Test route is working fine",
      date: null,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
});
// basic route
app.get("/", (req: Request, res: Response) => {
  res.status(httpStatus.OK).json({
    success: true,
    message: "Welcome to the Civicflow Api",
  });
});

app.use(globalErrorHandler);
app.use(notFound);
export default app;
