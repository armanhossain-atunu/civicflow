import { NextFunction, Request, Response } from "express";
import z from "zod";
import { catchAsync } from "../utils/catchAsync";

export const validateRequest = (zodSchema: z.ZodObject) => {
  return catchAsync((req: Request, res: Response, next: NextFunction) => {
    const payload = {
      body: req.body ?? {},
      params: req.params,
      query: req.query,
    };

    const result = zodSchema.safeParse(payload);

    if (!result.success) {
      console.log(result.error);
      console.log(result.error.issues);

      throw new Error(result.error.issues[0]?.message ?? "Validation failed");
    }

    req.body = result.data.body ?? req.body;

    next();
  });
};
