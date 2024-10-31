-- AlterTable
ALTER TABLE "difys" ADD COLUMN     "split_messages" BOOLEAN DEFAULT false,
ADD COLUMN     "time_per_char" INTEGER DEFAULT 50;

-- AlterTable
ALTER TABLE "dify_settings" ADD COLUMN     "split_messages" BOOLEAN DEFAULT false,
ADD COLUMN     "time_per_char" INTEGER DEFAULT 50;

-- AlterTable
ALTER TABLE "evolution_bots" ADD COLUMN     "split_messages" BOOLEAN DEFAULT false,
ADD COLUMN     "time_per_char" INTEGER DEFAULT 50;

-- AlterTable
ALTER TABLE "evolution_bot_settings" ADD COLUMN     "split_messages" BOOLEAN DEFAULT false,
ADD COLUMN     "time_per_char" INTEGER DEFAULT 50;

-- AlterTable
ALTER TABLE "flowises" ADD COLUMN     "split_messages" BOOLEAN DEFAULT false,
ADD COLUMN     "time_per_char" INTEGER DEFAULT 50;

-- AlterTable
ALTER TABLE "flowise_settings" ADD COLUMN     "split_messages" BOOLEAN DEFAULT false,
ADD COLUMN     "time_per_char" INTEGER DEFAULT 50;

-- AlterTable
ALTER TABLE "openai_bots" ADD COLUMN     "split_messages" BOOLEAN DEFAULT false,
ADD COLUMN     "time_per_char" INTEGER DEFAULT 50;

-- AlterTable
ALTER TABLE "openai_settings" ADD COLUMN     "split_messages" BOOLEAN DEFAULT false,
ADD COLUMN     "time_per_char" INTEGER DEFAULT 50;
