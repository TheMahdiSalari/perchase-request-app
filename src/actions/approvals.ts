"use server";

import { db } from "@/db";
import { requests, requestLogs, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

// ۱. تعریف تایپ دقیق نقش‌ها
type UserRole = 'USER' | 'MANAGER' | 'PROCUREMENT' | 'ADMIN_MANAGER' | 'FINANCE_MANAGER' | 'CEO';

// ۲. تعریف تایپ دقیق برای ورودی پیش‌فاکتورها (جایگزین any)
type ProformaInput = {
  id: number;
  supplier: string;
  price: number;
  description?: string;
  link?: string;
  selected: boolean;
  fileName?: string;
  fileData?: string;
};

// ورودی اکشن: تایید، رد، یا درخواست پیش‌فاکتور
export async function processRequest(
  requestId: number, 
  action: "APPROVE" | "REJECT" | "REQUEST_PROFORMA",
  comment?: string
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const request = await db.query.requests.findFirst({ where: eq(requests.id, requestId) });
  if (!request) throw new Error("Request not found");

  if (request.currentApproverId !== user.id) {
    throw new Error("دسترسی ندارید");
  }

  try {
    await db.transaction(async (tx) => {
      let nextStatus = request.status;
      let nextApproverId = request.currentApproverId;

      if (action === "REJECT") {
        nextStatus = "REJECTED";
        nextApproverId = null;
      } 
      else if (action === "REQUEST_PROFORMA") { 
        // سناریوی بازگشت به تدارکات
        const procurementUser = await tx.query.users.findFirst({
          where: eq(users.role, 'PROCUREMENT')
        });
        
        if (!procurementUser) throw new Error("کاربر تدارکات یافت نشد");
        
        nextStatus = "WAITING_FOR_PROFORMA";
        nextApproverId = procurementUser.id;
        comment = comment || "جهت استعلام قیمت و بارگذاری پیش‌فاکتور عودت داده شد";
      } 
      else {
        // منطق عادی تایید
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
          const nextUser = await tx.query.users.findFirst({
            where: eq(users.role, nextRole as UserRole)
          });
          nextApproverId = nextUser ? nextUser.id : null;
          nextStatus = nextUser ? "PENDING" : "APPROVED";
        }
      }

      await tx.update(requests).set({ 
        status: nextStatus, 
        currentApproverId: nextApproverId, 
        updatedAt: new Date() 
      }).where(eq(requests.id, requestId));

      await tx.insert(requestLogs).values({
        requestId: requestId,
        actorId: user.id,
        action: action,
        comment: comment || (action === "APPROVE" ? "تایید شد" : "بدون توضیحات"),
      });
    });

    revalidatePath(`/dashboard/requests/${requestId}`);
  
  } catch (error: unknown) {
    console.error(error);
    throw new Error("خطا در پردازش");
  }

  redirect("/dashboard/requests");
}

// ۳. اصلاح ورودی تابع: استفاده از ProformaInput[] به جای any[]
export async function submitProformas(requestId: number, proformas: ProformaInput[]) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'PROCUREMENT') throw new Error("فقط تدارکات مجاز است");

  // پیدا کردن مدیر مالی برای ارسال مجدد
  const financeUser = await db.query.users.findFirst({
    where: eq(users.role, 'FINANCE_MANAGER')
  });

  if (!financeUser) throw new Error("مدیر مالی یافت نشد");

  // محاسبه قیمت انتخابی
  const selectedProforma = proformas.find(p => p.selected);
  const finalAmount = selectedProforma ? selectedProforma.price : 0;

  try {
    await db.transaction(async (tx) => {
      await tx.update(requests).set({
        proformaData: proformas,
        totalAmount: finalAmount, // آپدیت قیمت نهایی
        status: 'PENDING', // برمی‌گردد به حالت عادی
        currentApproverId: financeUser.id, // میره مستقیم برای مدیر مالی
        updatedAt: new Date()
      }).where(eq(requests.id, requestId));

      await tx.insert(requestLogs).values({
        requestId: requestId,
        actorId: user.id,
        action: 'SUBMIT',
        comment: `پیش‌فاکتورها بارگذاری شد (انتخاب شده: ${selectedProforma?.supplier})`,
      });
    });

    revalidatePath(`/dashboard/requests/${requestId}`);
    
  } catch (error: unknown) {
    console.error(error);
    throw new Error("خطا در ثبت پیش‌فاکتور");
  }

  redirect("/dashboard/requests");
}