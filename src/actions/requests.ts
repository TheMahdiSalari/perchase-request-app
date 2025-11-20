"use server";

import { db } from "@/db";
import { requests, requestItems, requestLogs } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { createRequestSchema, CreateRequestValues } from "@/lib/validations";
import { redirect } from "next/navigation";
import { createNotification } from "@/actions/notifications"; // 👈 اضافه شد

export async function submitRequest(data: CreateRequestValues) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const validatedFields = createRequestSchema.safeParse(data);
  if (!validatedFields.success) {
    throw new Error("اطلاعات نامعتبر است");
  }

  const { title, description, items } = validatedFields.data;
  const totalAmount = 0;

  try {
    await db.transaction(async (tx) => {
      const approverId = user.managerId; 
      const initialStatus = approverId ? 'PENDING' : 'APPROVED';

      const [newRequest] = await tx.insert(requests).values({
        requesterId: user.id,
        title: title,
        description: description,
        totalAmount: totalAmount,
        status: initialStatus,
        currentApproverId: approverId,
      }).returning();

      if (items.length > 0) {
        await tx.insert(requestItems).values(
          items.map((item) => ({
            requestId: newRequest.id,
            name: item.name,
            quantity: item.quantity,
            price: 0,
            link: item.link,
          }))
        );
      }

      await tx.insert(requestLogs).values({
        requestId: newRequest.id,
        actorId: user.id,
        action: 'SUBMIT',
        comment: 'درخواست ثبت شد',
      });

      // 👈 ارسال اعلان به مدیر مستقیم (اگر وجود داشته باشد)
      if (approverId) {
        await createNotification(
            approverId,
            `درخواست جدید از ${user.name}: "${title}"`,
            `/dashboard/requests/${newRequest.id}`
        );
      }
    });

  } catch (error: unknown) {
    console.error("Transaction Error:", error);
    throw new Error("خطا در ثبت اطلاعات در دیتابیس");
  }

  redirect("/dashboard");
}