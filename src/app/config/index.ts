/** biome-ignore-all lint/style/useNodejsImportProtocol: <explanation> */
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });
export default {
	node_env: process.env.NODE_ENV,
	port: process.env.PORT,
	database_url: process.env.DATABASE_URL,
	backend_url: process.env.BACKEND_URL,
	frontend_url: process.env.FRONTEND_URL,
	bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
	jwt_access_secret: process.env.JWT_ACCESS_SECRET!,
	jwt_refresh_secret: process.env.JWT_REFRESH_SECRET!,
	jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN!,
	jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN!,
	google_client_id: process.env.GOOGLE_CLIENT_ID!,
	// Admin
	admin_name: process.env.ADMIN_NAME!,
	admin_email: process.env.ADMIN_EMAIL!,
	admin_password: process.env.ADMIN_PASSWORD!,
	// Manager
	manager_name: process.env.MANAGER_NAME!,
	manager_email: process.env.MANAGER_EMAIL!,
	manager_password: process.env.MANAGER_PASSWORD!,
	// Technician
	technician_name: process.env.TECHNICIAN_NAME!,
	technician_email: process.env.TECHNICIAN_EMAIL!,
	technician_password: process.env.TECHNICIAN_PASSWORD!,
	// Redis configuration
	redis_user: process.env.REDIS_USER!,
	redis_password: process.env.REDIS_PASSWORD!,
	redis_host: process.env.REDIS_HOST!,
	redis_port: process.env.REDIS_PORT!,
	//   Nodemailer
	smtp_user: process.env.SMTP_USER!,
	smtp_password: process.env.SMTP_PASSWORD!,
	email_sender: process.env.EMAIL_SENDER!,
	//   Cloudinary
	cloudinary_cloud_name: process.env.ClOUDINARY_CLOUD_NAME!,
	cloudinary_api_key: process.env.CLOUDINARY_API_KEY!,
	cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET!,
	//   Bkash
	bkash_base_url: process.env.BKASH_BASE_URL!,
	bkash_app_key: process.env.BKASH_APP_KEY!,
	bkash_app_secret: process.env.BKASH_APP_SECRET!,
	bkash_username: process.env.BKASH_USERNAME!,
	bkash_password: process.env.BKASH_PASSWORD!,
	bkash_callback_url:
		process.env.BKASH_CALLBACK_URL ||
		`${process.env.BACKEND_URL}/api/v1/payments/bkash/callback`,
};
