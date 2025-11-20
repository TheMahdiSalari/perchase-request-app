"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { markAsRead } from "@/actions/notifications";
import { useRouter } from "next/navigation";

interface Notification {
  id: number;
  message: string;
  link: string | null;
  isRead: boolean | null;
  createdAt: Date | null;
}

export function NotificationBell({ data }: { data: Notification[] }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(data);
  
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleRead = async (id: number, link: string | null) => {
    // ۱. آپدیت سریع ظاهر (Optimistic UI)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    
    // ۲. ارسال درخواست به سرور
    await markAsRead(id);
    
    // ۳. هدایت کاربر
    if (link) router.push(link);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-slate-600" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white animate-pulse" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 shadow-lg border-slate-200">
        <DropdownMenuLabel className="text-right">اعلان‌ها</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">هیچ پیام جدیدی ندارید</div>
        ) : (
            <div className="max-h-96 overflow-y-auto">
                {notifications.map((item) => (
                    <DropdownMenuItem 
                        key={item.id} 
                        className={`cursor-pointer flex flex-col items-start gap-1 p-3 mb-1 mx-1 rounded-md ${!item.isRead ? 'bg-blue-50 font-medium border-r-4 border-blue-500' : 'opacity-70'}`}
                        onClick={() => handleRead(item.id, item.link)}
                    >
                        <span className="text-xs leading-relaxed w-full text-right">{item.message}</span>
                        <span className="text-[10px] text-slate-400 w-full text-left dir-ltr font-mono">
                            {item.createdAt ? new Date(item.createdAt).toLocaleTimeString('fa-IR', {hour: '2-digit', minute:'2-digit'}) : ''}
                        </span>
                    </DropdownMenuItem>
                ))}
            </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}