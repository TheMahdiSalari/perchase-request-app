import { db } from "./index";
import { users } from "./schema";
import { sql } from "drizzle-orm";

async function main() {
  console.log("🔥 در حال پاکسازی کامل دیتابیس (Hard Reset)...");

  // استفاده از دستور SQL خام برای پاکسازی سریع و قدرتمند
  // CASCADE باعث می‌شود تمام جداول وابسته (مثل لاگ‌ها و درخواست‌ها) هم اتوماتیک پاک شوند
  await db.execute(sql`TRUNCATE TABLE "users", "requests", "request_items", "request_logs" RESTART IDENTITY CASCADE`);

  console.log("🌱 در حال ساخت چارت سازمانی جدید...");

  // ۱. مدیر عامل
  const [ceo] = await db.insert(users).values({
    name: "دکتر مدیر عامل",
    email: "ceo@company.com",
    password: "123",
    role: "CEO",
    phone: "09120000001",
  }).returning();

  // ۲. مدیر مالی
  await db.insert(users).values({
    name: "خانم حسابدار (مدیر مالی)",
    email: "finance@company.com",
    password: "123",
    role: "FINANCE_MANAGER",
    phone: "09120000002",
  });

  // ۳. مدیر اداری
  await db.insert(users).values({
    name: "آقای ناظم (مدیر اداری)",
    email: "admin@company.com",
    password: "123",
    role: "ADMIN_MANAGER",
    phone: "09120000003",
  });

  // ۴. تدارکات
  await db.insert(users).values({
    name: "آقای انباردار (تدارکات)",
    email: "supply@company.com",
    password: "123",
    role: "PROCUREMENT",
    phone: "09120000004",
  });

  // ۵. مدیر مستقیم (فنی)
  const [directManager] = await db.insert(users).values({
    name: "سارا مدیر فنی",
    email: "manager@company.com",
    password: "123",
    role: "MANAGER",
    phone: "09120000005",
  }).returning();

  // ۶. کارمند
  await db.insert(users).values({
    name: "علی برنامه نویس",
    email: "ali@company.com",
    password: "123",
    role: "USER",
    phone: "09120000006",
    managerId: directManager.id,
  });

  console.log("✅ دیتابیس با موفقیت بازنشانی شد.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});