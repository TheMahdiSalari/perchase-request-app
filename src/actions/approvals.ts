"use server";

import { db } from "@/db";
import { requests, requestLogs, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

// ۱. تعریف تایپ دقیق نقش‌ها برای جلوگیری از ارور any
type UserRole = 'USER' | 'MANAGER' | 'PROCUREMENT' | 'ADMIN_MANAGER' | 'FINANCE_MANAGER' | 'CEO';

export async function processRequest(requestId: number, action: "APPROVE" | "REJECT", comment?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const request = await db.query.requests.findFirst({
    where: eq(requests.id, requestId),
  });

  if (!request) throw new Error("Request not found");

  if (request.currentApproverId !== user.id) {
    throw new Error("شما دسترسی تایید این درخواست را ندارید");
  }

  try {
    await db.transaction(async (tx) => {
      let nextStatus = request.status;
      let nextApproverId = request.currentApproverId;

      if (action === "REJECT") {
        nextStatus = "REJECTED";
        nextApproverId = null;
      } else {
        // === منطق گردش کار سازمانی ===
        const currentRole = user.role;
        let nextRole = '';
        
        if (currentRole === 'MANAGER') nextRole = 'PROCUREMENT';
        else if (currentRole === 'PROCUREMENT') nextRole = 'ADMIN_MANAGER';
        else if (currentRole === 'ADMIN_MANAGER') nextRole = 'FINANCE_MANAGER';
        else if (currentRole === 'FINANCE_MANAGER') nextRole = 'CEO';
        else if (currentRole === 'CEO') nextRole = 'FINISHED';

        if (nextRole === 'FINISHED') {
          nextStatus = "APPROVED";
          nextApproverId = null;
        } else {
          // پیدا کردن مسئول مرحله بعد
          const nextUser = await tx.query.users.findFirst({
            // 👈 اصلاح مهم: کست کردن به تایپ دقیق UserRole به جای any
            where: eq(users.role, nextRole as UserRole)
          });

          if (nextUser) {
            nextApproverId = nextUser.id;
            nextStatus = "PENDING";
          } else {
            // اگر مسئول مرحله بعد نبود، پروسه تکمیل می‌شود
            nextStatus = "APPROVED"; 
            nextApproverId = null;
          }
        }
      }

      await tx.update(requests)
        .set({ 
          status: nextStatus, 
          currentApproverId: nextApproverId,
          updatedAt: new Date()
        })
        .where(eq(requests.id, requestId));

      await tx.insert(requestLogs).values({
        requestId: requestId,
        actorId: user.id,
        action: action,
        comment: comment || (action === "APPROVE" ? "تایید شد" : "بدون توضیحات"),
      });
    });
    
    revalidatePath("/dashboard/requests");
    revalidatePath(`/dashboard/requests/${requestId}`);

  } catch (error: unknown) { // تایپ unknown برای رعایت قوانین strict
    console.error("Error:", error);
    throw new Error("خطا در پردازش درخواست");
  }

  redirect("/dashboard/requests");
}