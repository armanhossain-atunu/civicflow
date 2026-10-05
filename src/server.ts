import app from "./app";
import { transporter } from "./app/lib/Nodemailer";
import { prisma } from "./app/lib/prisma";
import { redisClient } from "./app/lib/redis";
import { seedAdmin, seedManager, seedTechnician } from "./app/utils/seed";

const PORT = process.env.PORT || 5000;

async function main() {
  try {
    // Database
    await prisma.$connect();
    console.log("Connected to the database successfully.");

    // Redis
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    console.log("Connected to Redis successfully.");

    // Nodemailer
    await transporter.verify();
    console.log("Nodemailer is successfully connected.");

    // Seed
    await seedAdmin();
    await seedManager();
    await seedTechnician();

    // Server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error starting the server:", error);
    process.exit(1);
  }
}

main();
