import { prisma } from "@/lib/db/prisma";
import { NotificationType } from "@prisma/client";

export interface CreateNotificationOptions {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  linkUrl?: string;
}

export async function createNotification(options: CreateNotificationOptions) {
  try {
    return await prisma.notification.create({
      data: {
        userId: options.userId,
        title: options.title,
        message: options.message,
        type: options.type || "SYSTEM",
        linkUrl: options.linkUrl,
        isRead: false,
      },
    });
  } catch (err) {
    console.error("Failed to create in-app notification:", err);
  }
}
