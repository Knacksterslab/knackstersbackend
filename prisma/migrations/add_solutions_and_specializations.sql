-- Add Solution Type enum
CREATE TYPE "SolutionType" AS ENUM (
  'AI_MACHINE_LEARNING',
  'CYBERSECURITY',
  'SOFTWARE_DEVELOPMENT',
  'DESIGN_CREATIVE',
  'MARKETING_GROWTH',
  'HEALTHCARE_LIFE_SCIENCES',
  'MULTIPLE',
  'OTHER'
);

-- Add solution selection fields for clients
ALTER TABLE "users" ADD COLUMN "selected_solution" "SolutionType";
ALTER TABLE "users" ADD COLUMN "selected_solution_notes" TEXT;

-- Add specializations array for managers
ALTER TABLE "users" ADD COLUMN "specializations" "SolutionType"[] DEFAULT ARRAY[]::"SolutionType"[];

-- Create indexes for better query performance
CREATE INDEX "users_selected_solution_idx" ON "users"("selected_solution");
CREATE INDEX "users_specializations_idx" ON "users" USING GIN("specializations");
