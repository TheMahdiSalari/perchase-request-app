import { db } from "@/db";
import { requests, requestLogs } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { count, eq, and, desc, sum } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; // 👈 این خط اضافه شد
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Wallet, 
  Activity,
  ArrowLeft,
  Check
} from "lucide-react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const isFinanceOrCEO = user.role === 'FINANCE_MANAGER' || user.role === 'CEO';
  const isProcurement = user.role === 'PROCUREMENT';

  // ۱. آمارها (به صورت موازی)
  const [
    pendingActionCount,
    myTotalRequests,
    myApprovedRequests,
    totalSpentResult,
    latestLogs
  ] = await Promise.all([
    
    // کوئری ۱: کارتابل (نیاز به اقدام)
    db.select({ value: count() })
      .from(requests)
      .where(eq(requests.currentApproverId, user.id)),

    // کوئری ۲: کل درخواست‌ها
    db.select({ value: count() })
      .from(requests)
      .where(isFinanceOrCEO ? undefined : eq(requests.requesterId, user.id)),

    // کوئری ۳: درخواست‌های تایید شده
    db.select({ value: count() })
      .from(requests)
      .where(and(
        eq(requests.status, 'APPROVED'),
        isFinanceOrCEO ? undefined : eq(requests.requesterId, user.id)
      )),

    // کوئری ۴: جمع مبلغ
    db.select({ value: sum(requests.totalAmount) })
      .from(requests)
      .where(and(
        eq(requests.status, 'APPROVED'),
        isFinanceOrCEO ? undefined : eq(requests.requesterId, user.id)
      )),

    // کوئری ۵: آخرین فعالیت‌ها
    db.query.requestLogs.findMany({
      where: isFinanceOrCEO ? undefined : eq(requestLogs.actorId, user.id),
      with: { 
        request: true,
        actor: true 
      },
      orderBy: [desc(requestLogs.createdAt)],
      limit: 5
    })
  ]);

  const stats = {
    total: myTotalRequests[0].value,
    approved: myApprovedRequests[0].value,
    totalSpent: Number(totalSpentResult[0].value) || 0
  };
  
  const inboxCount = pendingActionCount[0].value;

  return (
    <div className="space-y-8">
      
      {/* === بخش ۱: خوش‌آمدگویی === */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">داشبورد مدیریت</h1>
          <p className="text-muted-foreground mt-1">
            خوش آمدید، <span className="font-bold text-primary">{user.name}</span> ({user.role})
          </p>
        </div>
        <div className="flex gap-2">
            <Button asChild>
                <Link href="/dashboard/requests/new">
                    + ثبت درخواست جدید
                </Link>
            </Button>
        </div>
      </div>

      {/* === بخش ۲: هشدار کارتابل === */}
      {inboxCount > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-5">
            <div className="flex items-center gap-4">
                <div className="bg-orange-100 p-3 rounded-full">
                    <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-orange-800">شما {inboxCount} درخواست منتظر بررسی دارید!</h3>
                    <p className="text-sm text-orange-600">لطفاً جهت جلوگیری از توقف فرآیند خرید، سریع‌تر اقدام کنید.</p>
                </div>
            </div>
            <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100" asChild>
                <Link href="/dashboard/requests">
                    مشاهده کارتابل
                    <ArrowLeft className="w-4 h-4 mr-2" />
                </Link>
            </Button>
        </div>
      )}

      {/* === بخش ۳: کارت‌های آمار === */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        <Card className="border-t-4 border-t-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isFinanceOrCEO ? 'کل هزینه تایید شده' : 'خرید‌های انجام شده من'}
            </CardTitle>
            <Wallet className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
                {stats.totalSpent.toLocaleString()} <span className="text-xs text-muted-foreground font-normal">تومان</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              مجموع اقلام تایید نهایی شده
            </p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-slate-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">کل درخواست‌ها</CardTitle>
            <FileText className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              تعداد کل درخواست‌های ثبت شده
            </p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-green-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">تایید نهایی</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{stats.approved}</div>
            <p className="text-xs text-muted-foreground mt-1">
              درخواست‌های تکمیل شده
            </p>
          </CardContent>
        </Card>

        <Card className={`border-t-4 shadow-sm ${isProcurement ? 'border-t-orange-500' : 'border-t-yellow-500'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
                {isProcurement ? 'نیاز به استعلام' : 'در جریان'}
            </CardTitle>
            <Clock className={`h-4 w-4 ${isProcurement ? 'text-orange-500' : 'text-yellow-500'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{stats.total - stats.approved}</div>
            <p className="text-xs text-muted-foreground mt-1">
               {isProcurement ? 'درخواست‌های منتظر پیش‌فاکتور' : 'در حال گردش در سازمان'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* === بخش ۴: فعالیت‌ها و دسترسی سریع === */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
        
        <Card className="md:col-span-4 lg:col-span-5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="w-4 h-4"/>
                آخرین فعالیت‌های سیستم
            </CardTitle>
            <CardDescription>۵ فعالیت اخیر مربوط به شما یا زیرمجموعه شما</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                {latestLogs.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4 text-sm">هنوز فعالیتی ثبت نشده است.</p>
                ) : (
                    latestLogs.map((log) => (
                        <div key={log.id} className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0">
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${
                                    log.action === 'APPROVE' ? 'bg-green-500' : 
                                    log.action === 'REJECT' ? 'bg-red-500' : 'bg-blue-500'
                                }`} />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">
                                        {log.actor.name} 
                                        <span className="text-muted-foreground mx-1">
                                            {log.action === 'SUBMIT' ? 'درخواستی ثبت کرد:' : 
                                             log.action === 'APPROVE' ? 'درخواستی را تایید کرد:' : 
                                             log.action === 'REQUEST_PROFORMA' ? 'درخواست پیش‌فاکتور داد:' : 'درخواستی را رد کرد:'}
                                        </span>
                                        <span className="text-slate-800 mr-1">`‍{log.request?.title}`‍‍</span>
                                    </span>
                                    <span className="text-xs text-muted-foreground mt-0.5">{log.comment}</span>
                                </div>
                            </div>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap dir-ltr">
                                {log.createdAt ? new Date(log.createdAt).toLocaleDateString('fa-IR') : ''}
                            </span>
                        </div>
                    ))
                )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 lg:col-span-2 bg-slate-50/50">
            <CardHeader>
                <CardTitle className="text-base">دسترسی سریع</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                <Link href="/dashboard/requests/new" className="flex items-center justify-between p-3 bg-white border rounded hover:shadow-sm transition-all group">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 text-blue-600 p-2 rounded-lg"><FileText size={18}/></div>
                        <span className="text-sm font-medium">ثبت درخواست</span>
                    </div>
                    <ArrowLeft size={16} className="text-slate-300 group-hover:text-primary transition-colors"/>
                </Link>
                
                <Link href="/dashboard/requests" className="flex items-center justify-between p-3 bg-white border rounded hover:shadow-sm transition-all group">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-100 text-purple-600 p-2 rounded-lg"><CheckCircle2 size={18}/></div>
                        <span className="text-sm font-medium">کارتابل شخصی</span>
                    </div>
                    {inboxCount > 0 && <Badge className="bg-orange-500 h-5 px-1.5">{inboxCount}</Badge>}
                </Link>

                {isFinanceOrCEO && (
                    <Link href="/dashboard/requests" className="flex items-center justify-between p-3 bg-white border rounded hover:shadow-sm transition-all group">
                        <div className="flex items-center gap-3">
                            <div className="bg-green-100 text-green-600 p-2 rounded-lg"><TrendingUp size={18}/></div>
                            <span className="text-sm font-medium">گزارشات مالی</span>
                        </div>
                        <ArrowLeft size={16} className="text-slate-300 group-hover:text-primary transition-colors"/>
                    </Link>
                )}
            </CardContent>
        </Card>

      </div>
    </div>
  );
}