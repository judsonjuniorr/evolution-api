-- CreateIndex
CREATE INDEX "Chat_instanceId_idx" ON "chats"("instance_id");

-- CreateIndex
CREATE INDEX "Chat_remoteJid_idx" ON "chats"("remote_jid");

-- CreateIndex
CREATE INDEX "Contact_remoteJid_idx" ON "contacts"("remote_jid");

-- CreateIndex
CREATE INDEX "Contact_instanceId_idx" ON "contacts"("instance_id");

-- CreateIndex
CREATE INDEX "Message_instanceId_idx" ON "messages"("instance_id");

-- CreateIndex
CREATE INDEX "MessageUpdate_instanceId_idx" ON "message_updates"("instance_id");

-- CreateIndex
CREATE INDEX "MessageUpdate_messageId_idx" ON "message_updates"("message_id");

-- CreateIndex
CREATE INDEX "Setting_instanceId_idx" ON "settings"("instance_id");

-- CreateIndex
CREATE INDEX "Webhook_instanceId_idx" ON "webhooks"("instance_id");
