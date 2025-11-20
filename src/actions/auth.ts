"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// این تابع نقش "لاگین" را بازی می‌کند
export async function loginAsUser(userId: number) {
  // ذخیره ID کاربر در کوکی (فقط برای محیط توسعه امن است)
  const cookieStore = await cookies();
  cookieStore.set("dev_user_id", userId.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // ۱ هفته
  });

  redirect("/dashboard");
}

// این تابع برای "خروج" است
export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("dev_user_id");
  redirect("/login");
}