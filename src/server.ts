import app from "./app";

const PORT = process.env.PORT || 5000;

const main = async () => {
	try {
		app.listen(PORT, () => {
			console.log(`🚀 CivicFlow server is running on port ${PORT}`);
		});
	} catch (error) {
		console.error("❌ Error starting the server:", error);
		process.exit(1);
	}
};

main();
