"use server";

import { db } from "@/db";
import { requests, requestLogs, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function processRequest(requestId: number, action: "APPROVE" | "REJECT", comment?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const request = await db.query.requests.findFirst({
    where: eq(requests.id, requestId),
    with: { requester: true }
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
        const currentUserFull = await tx.query.users.findFirst({
          where: eq(users.id, user.id)
        });

        if (currentUserFull?.managerId) {
          nextApproverId = currentUserFull.managerId;
          nextStatus = "PENDING";
        } else {
          nextApproverId = null;
          nextStatus = "APPROVED";
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
    
    // رفرش کردن کش‌ها
    revalidatePath("/dashboard/requests");
    revalidatePath(`/dashboard/requests/${requestId}`);

  } catch (error) {
    console.error("Error processing request:", error);
    return { success: false, message: "خطا در ثبت اطلاعات در دیتابیس" };
  }

  // ⭐️ نکته کلیدی: ریدایرکت باید بیرون از try/catch باشد
  // اگر عملیات موفق بود، اینجا ریدایرکت می‌شود و اروری هم به کلاینت برنمی‌گردد
  redirect("/dashboard/requests");
}