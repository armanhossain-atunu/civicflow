# CivicFlow API

CivicFlow is a REST API for civic complaint management. Citizens can submit and track complaints, while administrators, managers, and technicians manage categories, assignments, status changes, feedback, and complaint payments.

## Project Analysis

- **Runtime:** Node.js with TypeScript and ESM
- **Framework:** Express 5
- **Database:** PostgreSQL through Prisma 7 and the `@prisma/adapter-pg` driver
- **Authentication:** JWT access and refresh tokens, HTTP-only cookies, Bearer-token support, and Google OAuth login
- **Validation:** Zod request schemas
- **Caching/infrastructure:** Redis, Nodemailer, Cloudinary, and bKash sandbox integration
- **Authorization roles:** `CITIZEN`, `STAFF`, `TECHNICIAN`, `MANAGER`, `ADMIN`
- **Database models:** users, citizens, categories, complaints, assignments, feedback, payments, work updates, attachments, and complaint status history

The server connects to PostgreSQL, Redis, and SMTP before listening. On startup it also creates the configured admin, manager, and technician users if they do not already exist.

## Requirements

- Node.js 20 or newer
- npm
- PostgreSQL
- Redis
- SMTP credentials
- Cloudinary credentials for profile-image uploads
- Google OAuth credentials for Google login
- bKash sandbox credentials for payment flows

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file:

   ```bash
   cp .env.example .env
   ```

   On Windows PowerShell, use:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Replace every placeholder and development credential in `.env`. Do not commit `.env` or real API credentials. The existing example file contains credential-shaped values, so rotate any credentials that have been shared publicly.

4. Set `DATABASE_URL` to a reachable PostgreSQL database. The Prisma configuration loads the schema from `prisma/schema` and migrations from `prisma/migrations`.

5. Generate Prisma Client and apply migrations:

   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

   For local schema development, use `npx prisma migrate dev --name your_migration_name` instead of `migrate deploy`.

## Running the API

Development mode with file watching:

```bash
npm run dev
```

Build and run the production bundle:

```bash
npm run build
npm start
```

The default server URL is `http://localhost:5000`.

Basic health routes:

- `GET /` returns the CivicFlow welcome response.
- `GET /test` checks the bKash integration and should only be used when the bKash configuration is available.

## Environment Variables

The complete list is available in `.env.example`. The main groups are:

| Group        | Variables                                                                                    |
| ------------ | -------------------------------------------------------------------------------------------- |
| Server       | `NODE_ENV`, `PORT`, `BACKEND_URL`, `FRONTEND_URL`                                            |
| Database     | `DATABASE_URL`                                                                               |
| JWT          | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` |
| Seed users   | `ADMIN_*`, `MANAGER_*`, `TECHNICIAN_*`                                                       |
| Redis        | `REDIS_USER`, `REDIS_PASSWORD`, `REDIS_HOST`, `REDIS_PORT`                                   |
| Email        | `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_SENDER`                                                 |
| Media        | `ClOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`                       |
| Integrations | `GOOGLE_CLIENT_ID` and the `BKASH_*` variables                                               |

`BKASH_CALLBACK_URL` is optional. If it is not set, the API derives it from `BACKEND_URL`.

## Authentication

Login and email verification return access and refresh tokens and also set HTTP-only cookies. Protected requests can use either the cookie or this header:

```http
Authorization: Bearer <access-token>
```

The included [Postman collection](civicflow.postman_collection.json) uses the `{{accessToken}}` variable for Bearer authentication.

## API Routes

All versioned routes use the `/api/v1` prefix.

### Authentication: `/api/v1/auth`

| Method | Route              | Access               |
| ------ | ------------------ | -------------------- |
| `POST` | `/register`        | Public               |
| `POST` | `/verify-email`    | Public               |
| `POST` | `/login`           | Public               |
| `POST` | `/forget-password` | Public               |
| `POST` | `/reset-password`  | Public               |
| `GET`  | `/me`              | Authenticated users  |
| `POST` | `/refresh-token`   | Refresh-token cookie |
| `POST` | `/google`          | Public               |

### Users: `/api/v1/user`

| Method   | Route             | Access                                     |
| -------- | ----------------- | ------------------------------------------ |
| `GET`    | `/`               | Admin                                      |
| `PATCH`  | `/profile-image`  | Authenticated users except anonymous users |
| `PATCH`  | `/:userId/status` | Admin                                      |
| `PATCH`  | `/:userId/role`   | Admin                                      |
| `DELETE` | `/:userId`        | Admin                                      |

`PATCH /profile-image` expects multipart form-data with a `profileImage` file field.

### Categories: `/api/v1/categories`

| Method   | Route     | Access |
| -------- | --------- | ------ |
| `POST`   | `/`       | Admin  |
| `GET`    | `/`       | Public |
| `GET`    | `/active` | Public |
| `GET`    | `/:id`    | Public |
| `PATCH`  | `/:id`    | Admin  |
| `DELETE` | `/:id`    | Admin  |

### Complaints: `/api/v1/complaint`

| Method   | Route           | Access                              |
| -------- | --------------- | ----------------------------------- |
| `POST`   | `/`             | Citizen                             |
| `GET`    | `/`             | Admin, manager, technician, citizen |
| `GET`    | `/my`           | Citizen                             |
| `GET`    | `/:complaintId` | Citizen                             |
| `DELETE` | `/:id`          | Citizen                             |

A complaint requires `title`, `description`, `categoryId`, `department`, and `location`.

### Complaint assignments: `/api/v1/complaint-assignments`

| Method  | Route                     | Access                     |
| ------- | ------------------------- | -------------------------- |
| `POST`  | `/`                       | Admin, manager             |
| `GET`   | `/complaint/:complaintId` | Admin, manager, technician |
| `GET`   | `/my-assignments`         | Technician                 |
| `PATCH` | `/:assignmentId/complete` | Technician                 |
| `PATCH` | `/:complaintId/close`     | Admin, manager             |

### Feedback: `/api/v1/feedbacks`

| Method   | Route           | Access                                 |
| -------- | --------------- | -------------------------------------- |
| `POST`   | `/`             | Citizen                                |
| `GET`    | `/`             | Public route, query validation enabled |
| `GET`    | `/my-feedbacks` | Citizen                                |
| `GET`    | `/:id`          | Citizen, admin, manager                |
| `PATCH`  | `/:id`          | Citizen                                |
| `DELETE` | `/:id`          | Citizen                                |

Feedback list queries support `page`, `limit`, `rating`, `search`, `sortBy`, and `sortOrder`.

### Payments: `/api/v1/payments`

| Method | Route                                  | Access         |
| ------ | -------------------------------------- | -------------- |
| `POST` | `/complaint/:complaintId/bkash/create` | Citizen        |
| `POST` | `/bkash/execute`                       | Citizen        |
| `GET`  | `/my-payments`                         | Citizen        |
| `GET`  | `/`                                    | Admin, manager |
| `GET`  | `/bkash/callback`                      | bKash callback |

## Request Examples

Register a citizen:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password@123",
  "citizen": {
    "contactNumber": "+8801700000000"
  }
}
```

Create a complaint:

```json
{
  "title": "Large pothole near school",
  "description": "There is a dangerous pothole near the main school entrance.",
  "categoryId": "category-uuid",
  "department": "Public Works",
  "location": "12 Main Street"
}
```

Create a complaint assignment:

```json
{
  "complaintId": "complaint-uuid",
  "assignedToId": "technician-uuid",
  "note": "Please inspect and update the complaint."
}
```

## Available Scripts

| Command                | Purpose                                         |
| ---------------------- | ----------------------------------------------- |
| `npm run dev`          | Start the development server with watch mode    |
| `npm run build`        | Bundle the server into `dist`                   |
| `npm start`            | Run the production bundle                       |
| `npm run format:check` | Check formatting for `src`                      |
| `npm run format:fix`   | Fix formatting for `src`                        |
| `npm run lint:check`   | Run Biome lint checks                           |
| `npm run lint:fix`     | Fix Biome lint issues                           |
| `npm test`             | Currently exits with `Error: no test specified` |

## Current Notes

- There is no automated test suite configured yet.
- The application startup is dependent on external PostgreSQL, Redis, SMTP, and integration configuration.
- Access tokens are supported through both cookies and the `Authorization` header.
- The repository includes database models for attachments and work updates, but the currently registered Express routes do not expose standalone endpoints for those models.
