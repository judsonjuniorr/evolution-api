-- DropIndex
DROP INDEX "Chat_remoteJid_idx";

-- DropIndex
DROP INDEX "Contact_instanceId_idx";

-- DropIndex
DROP INDEX "MessageUpdate_messageId_idx";

-- AlterTable
ALTER TABLE "pushers" RENAME CONSTRAINT "Pusher_pkey" TO "pushers_pkey";
ALTER TABLE "pushers" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ;

-- CreateIndex
CREATE INDEX "pushers_instance_id_idx" ON "pushers"("instance_id");

-- RenameForeignKey
ALTER TABLE "pushers" RENAME CONSTRAINT "Pusher_instanceId_fkey" TO "pushers_instance_id_fkey";

-- RenameIndex
ALTER INDEX "Chat_instanceId_idx" RENAME TO "chats_instance_id_idx";

-- RenameIndex
ALTER INDEX "Contact_remoteJid_idx" RENAME TO "contacts_remote_jid_idx";

-- RenameIndex
ALTER INDEX "MessageUpdate_instanceId_idx" RENAME TO "message_updates_instance_id_idx";

-- RenameIndex
ALTER INDEX "Message_instanceId_idx" RENAME TO "messages_instance_id_idx";

-- RenameIndex
ALTER INDEX "Pusher_instanceId_key" RENAME TO "pushers_instance_id_key";

-- RenameIndex
ALTER INDEX "Setting_instanceId_idx" RENAME TO "settings_instance_id_idx";

-- RenameIndex
ALTER INDEX "Webhook_instanceId_idx" RENAME TO "webhooks_instance_id_idx";
