import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
 
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // ۱. چک کردن امنیت در سطح Layout (لایه اول دفاعی)
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full bg-slate-50 min-h-screen flex flex-col">
        {/* هدر بالای صفحه */}
        <div className="border-b bg-white p-4 flex items-center gap-4 sticky top-0 z-10">
            <SidebarTrigger />
            <div className="flex flex-col">
                <h2 className="font-bold text-lg">سامانه تدارکات</h2>
                <span className="text-xs text-muted-foreground">خوش آمدید، {user.name}</span>
            </div>
        </div>
        
        {/* محتوای اصلی صفحات */}
        <div className="p-6 flex-1">
            {children}
        </div>
      </main>
    </SidebarProvider>
  )
}