-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "problem_embeddings" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "content" TEXT,
    "matadata" JSONB,
    "embedding" vector NOT NULL,

    CONSTRAINT "problem_embeddings_pkey" PRIMARY KEY ("id")
);
