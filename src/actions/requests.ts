"use server";

import { db } from "@/db";
import { requests, requestItems, requestLogs, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { createRequestSchema, CreateRequestValues } from "@/lib/validations";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

export async function submitRequest(data: CreateRequestValues) {
  // ۱. احراز هویت
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // ۲. اعتبارسنجی دیتا
  const validatedFields = createRequestSchema.safeParse(data);
  if (!validatedFields.success) {
    console.error("Validation Error:", validatedFields.error);
    throw new Error("اطلاعات نامعتبر است");
  }

  const { title, description, items } = validatedFields.data;
  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  try {
    await db.transaction(async (tx) => {
      
      // الف) پیدا کردن مدیر مستقیم
      // اگر کاربر managerId داشت، همان می‌شود مسئول تایید
      // اگر نداشت (مثلا مدیرعامل)، مقدار null می‌شود
      const approverId = user.managerId; 
      
      // ب) وضعیت اولیه
      // اگر رئیسی دارد -> PENDING (منتظر بررسی)
      // اگر رئیسی ندارد -> APPROVED (تایید اتوماتیک - سناریوی مدیرعامل)
      const initialStatus = approverId ? 'PENDING' : 'APPROVED';

      // پ) ثبت درخواست
      const [newRequest] = await tx.insert(requests).values({
        requesterId: user.id,
        title: title,
        description: description,
        totalAmount: totalAmount,
        status: initialStatus,
        currentApproverId: approverId, // می‌تواند null باشد
      }).returning();

      // ت) ثبت آیتم‌ها
      if (items.length > 0) {
        await tx.insert(requestItems).values(
          items.map((item) => ({
            requestId: newRequest.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            link: item.link,
          }))
        );
      }

      // ث) ثبت لاگ
      await tx.insert(requestLogs).values({
        requestId: newRequest.id,
        actorId: user.id,
        action: 'SUBMIT',
        comment: 'درخواست ثبت شد',
      });
    });

  } catch (error) {
    // اگر ارور واقعی دیتابیس داشتیم، اینجا چاپ می‌شود
    console.error("Transaction Error (Real Error):", error);
    throw new Error("خطا در ثبت اطلاعات در دیتابیس");
  }

  // ⭐️ نکته طلایی: ریدایرکت حتماً باید بیرون از try/catch باشد
  redirect("/dashboard");
}