import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
 
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // بررسی امنیت: آیا کاربر لاگین است؟
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <SidebarProvider>
      <AppSidebar />
      
      {/* تگ اصلی صفحه */}
      {/* کلاس‌های print:... باعث می‌شوند در زمان چاپ، صفحه سفید و بدون حاشیه اضافی باشد */}
      <main className="w-full bg-slate-50 min-h-screen flex flex-col print:m-0 print:p-0 print:bg-white print:block">
        
        {/* هدر بالای صفحه (شامل دکمه منو و خوش‌آمدگویی) */}
        {/* کلاس print:hidden این بخش را در فایل PDF مخفی می‌کند */}
        <div className="border-b bg-white p-4 flex items-center gap-4 sticky top-0 z-10 print:hidden">
            <SidebarTrigger />
            <div className="flex flex-col">
                <h2 className="font-bold text-lg">سامانه تدارکات</h2>
                <span className="text-xs text-muted-foreground">خوش آمدید، {user.name}</span>
            </div>
        </div>
        
        {/* محل نمایش محتوای صفحات */}
        {/* در حالت پرینت پدینگ را حذف می‌کنیم تا از فضای کاغذ استفاده شود */}
        <div className="p-6 flex-1 print:p-0">
            {children}
        </div>
      </main>
    </SidebarProvider>
  )
}