"use server";

import { db } from "@/db";
import { notifications } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ایجاد اعلان (فقط در سرور استفاده می‌شود)
export async function createNotification(userId: number, message: string, link: string) {
  try {
    await db.insert(notifications).values({
      userId,
      message,
      link,
      isRead: false,
    });
  } catch (error) {
    console.error("خطا در ثبت اعلان:", error);
  }
}

// دریافت اعلان‌های کاربر
export async function getMyNotifications() {
  const user = await getCurrentUser();
  if (!user) return [];

  return await db.query.notifications.findMany({
    where: eq(notifications.userId, user.id),
    orderBy: [desc(notifications.createdAt)],
    limit: 10,
  });
}

// خواندن اعلان
export async function markAsRead(notificationId: number) {
  await db.update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.id, notificationId));
    
  revalidatePath("/dashboard");
}