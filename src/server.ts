import app from "./app";
import { prisma } from "./app/lib/prisma";
import { seedAdmin, seedManager, seedTechnician } from "./app/utils/seed";


const PORT = process.env.PORT;
async function main() {
  try {
    await prisma.$connect();
    console.log("Connected to the database successfully.");
    await seedAdmin();
    await seedManager();
    await seedTechnician();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error starting the server:", error);
    process.exit(1);
  }
}

main();
