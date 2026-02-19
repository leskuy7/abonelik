-- AlterTable: Convert Float to Decimal for financial precision
ALTER TABLE "User" ALTER COLUMN "monthlyBudget" SET DATA TYPE DECIMAL(12,2);

ALTER TABLE "Subscription" ALTER COLUMN "price" SET DATA TYPE DECIMAL(12,2);

ALTER TABLE "Invoice" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2);
