import { db } from "@/db";
import { requests } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { count, eq, and } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  // ۱. دریافت کاربر (SSR)
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // ۲. فچ کردن داده‌ها به صورت موازی (Parallel Data Fetching) برای سرعت بالا
  // ما از Promise.all استفاده می‌کنیم تا کوئری‌ها همزمان اجرا شوند
  const [myRequestsCount, pendingForMeCount, approvedCount] = await Promise.all([
    
    // کوئری ۱: تعداد کل درخواست‌های من
    db.select({ value: count() })
      .from(requests)
      .where(eq(requests.requesterId, user.id)),

    // کوئری ۲: تعداد درخواست‌هایی که الان در کارتابل من است (منتظر تایید من)
    db.select({ value: count() })
      .from(requests)
      .where(eq(requests.currentApproverId, user.id)),

    // کوئری ۳: تعداد درخواست‌های من که تایید شده
    db.select({ value: count() })
      .from(requests)
      .where(and(
          eq(requests.requesterId, user.id),
          eq(requests.status, 'APPROVED')
      ))
  ]);

  const stats = {
    total: myRequestsCount[0].value,
    pendingAction: pendingForMeCount[0].value,
    approved: approvedCount[0].value
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">داشبورد وضعیت</h1>
      
      {/* کارت‌های آمار */}
      <div className="grid gap-4 md:grid-cols-3">
        
        {/* کارت ۱: اگر مدیر باشد این مهم است */}
        <Card className={user.role !== 'USER' ? "border-blue-500 bg-blue-50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {user.role === 'USER' ? 'درخواست‌های جاری' : 'کارتابل (نیاز به اقدام)'}
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingAction}</div>
            <p className="text-xs text-muted-foreground">
              موردی که الان دست شماست
            </p>
          </CardContent>
        </Card>

        {/* کارت ۲ */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل درخواست‌های من</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              از ابتدای سال مالی
            </p>
          </CardContent>
        </Card>

        {/* کارت ۳ */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تایید شده نهایی</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">
              خرید انجام شده
            </p>
          </CardContent>
        </Card>
      </div>

      {/* اینجا بعداً جدول آخرین درخواست‌ها را می‌گذاریم */}
      <div className="rounded-lg border bg-white p-8 text-center text-muted-foreground border-dashed">
         هنوز درخواستی ثبت نشده است.
      </div>
    </div>
  );
}