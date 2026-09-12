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

// app.get("/test",async (req: Request, res: Response, next: NextFunction) => {
//   try {

// 	const otp = crypto.randomInt(100000, 999999).toString()
//     res.status(httpStatus.OK).json({
//       success: true,
//       message: "Test route is working fine",
//       date:otp,
//     });
//   } catch (error) {
//     console.log(error);
//     next(error);
//   }
// });
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
