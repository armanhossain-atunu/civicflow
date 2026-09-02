import express, { Application, Request, Response } from "express";

const app: Application = express();

app.get("/", (req: Request, res: Response) => {
	res.send("Welcome to the CivicFlow app!");
});
export default app;
