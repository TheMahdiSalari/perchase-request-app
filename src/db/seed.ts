import 'dotenv/config'
import { db } from "./index";
import { users } from "./schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("🌱 در حال کاشت داده‌های اولیه (Seeding)...");

  // ۱. ساخت مدیر عامل (CEO) - کسی بالادستش نیست
  const [ceo] = await db.insert(users).values({
    name: "آقای مدیر عامل",
    email: "ceo@company.com",
    password: "123", // در واقعی باید هش شود
    role: "ADMIN",
    phone: "09120000001",
    managerId: null, // رئیس ندارد
  }).returning();
  
  console.log(`✅ مدیر عامل ساخته شد: ${ceo.name} (ID: ${ceo.id})`);

  // ۲. ساخت مدیر فنی (Manager) - زیردست CEO
  const [manager] = await db.insert(users).values({
    name: "سارا مدیر فنی",
    email: "manager@company.com",
    password: "123",
    role: "MANAGER",
    phone: "09120000002",
    managerId: ceo.id, // رئیسش CEO است
  }).returning();

  console.log(`✅ مدیر فنی ساخته شد: ${manager.name} (ID: ${manager.id})`);

  // ۳. ساخت کارمند (Employee) - زیردست Manager
  const [employee] = await db.insert(users).values({
    name: "علی برنامه نویس",
    email: "ali@company.com",
    password: "123",
    role: "USER",
    phone: "09120000003",
    managerId: manager.id, // رئیسش مدیر فنی است
  }).returning();

  console.log(`✅ کارمند ساخته شد: ${employee.name} (ID: ${employee.id})`);

  console.log("🚀 پایان عملیات Seed. دیتابیس آماده تست است!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ خطا در سید کردن:", err);
  process.exit(1);
});