import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { NotificationBell } from "@/components/notification-bell" // 👈 اضافه شد
import { getMyNotifications } from "@/actions/notifications" // 👈 اضافه شد

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // دریافت نوتیفیکیشن‌ها از دیتابیس
  const notifications = await getMyNotifications();

  return (
    <SidebarProvider>
      <AppSidebar />
      
      <main className="w-full bg-slate-50 min-h-screen flex flex-col print:m-0 print:p-0 print:bg-white print:block">
        
        {/* هدر */}
        <div className="border-b bg-white p-4 flex items-center justify-between sticky top-0 z-10 print:hidden h-16">
            <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div className="flex flex-col">
                    <h2 className="font-bold text-lg">سامانه تدارکات</h2>
                </div>
            </div>

            {/* سمت چپ: زنگوله و پروفایل */}
            <div className="flex items-center gap-4">
                <NotificationBell data={notifications} />
                
                <div className="hidden md:flex flex-col items-end border-r pr-4 mr-2">
                    <span className="text-sm font-bold">{user.name}</span>
                    <span className="text-xs text-muted-foreground">{user.role}</span>
                </div>
            </div>
        </div>
        
        <div className="p-6 flex-1 print:p-0">
            {children}
        </div>
      </main>
    </SidebarProvider>
  )
}