import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cache } from "react";

// از cache استفاده می‌کنیم تا در یک رندر، چند بار دیتابیس را صدا نزنیم
export const getCurrentUser = cache(async () => {
  const cookieStore = await cookies();
  const userId = cookieStore.get("dev_user_id")?.value;

  if (!userId) return null;

  // دریافت اطلاعات کامل کاربر از دیتابیس
  const user = await db.query.users.findFirst({
    where: eq(users.id, parseInt(userId)),
  });

  return user || null;
});