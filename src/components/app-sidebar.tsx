"use client"

import {
  LayoutDashboard,
  PlusCircle,
  ListChecks,
  Settings,
  LogOut,
  User
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// آیتم‌های منو
const items = [
  {
    title: "داشبورد",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "ثبت درخواست جدید",
    url: "/dashboard/requests/new",
    icon: PlusCircle,
  },
  {
    title: "کارتابل من",
    url: "/dashboard/requests",
    icon: ListChecks,
  },
]

export function AppSidebar() {
  return (
    <Sidebar side="right" className="print:hidden">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
           <div className="h-8 w-8 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold">
             PR
           </div>
           <span className="font-bold">سیستم خرید</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>منوی اصلی</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton className="text-red-500">
                    <LogOut />
                    <a href="/login">خروج</a>
                </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}