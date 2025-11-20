"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { processRequest } from "@/actions/approvals";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner"; // اگر نصب نکردی، میتونی حذفش کنی

export function ApprovalActions({ requestId }: { requestId: number }) {
  const [isPending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [comment, setComment] = useState("");

  const handleAction = (action: "APPROVE" | "REJECT") => {
    startTransition(async () => {
      try {
        await processRequest(requestId, action, comment);
        
        // اگر موفق شد، توست نمایش بده (ریدایرکت خودکار انجام میشه)
        toast.success("عملیات با موفقیت انجام شد");
        
      } catch (error: unknown) {
        
        // ✅ بخش مهم: نادیده گرفتن خطای ریدایرکت Next.js
        if (error instanceof Error) {
            if (error.message === "NEXT_REDIRECT" || error.message.includes("NEXT_REDIRECT")) {
                return; // یعنی موفقیت‌آمیز بوده و داره میره صفحه بعد
            }
        }

        console.error("Approval Error:", error);
        
        // نمایش پیام خطای واقعی
        let errorMessage = "خطا در انجام عملیات";
        if (error instanceof Error) {
             // اگر خطای ما دستی پرتاب شده باشه (مثل 'دسترسی ندارید') اینجا نمایش داده میشه
             errorMessage = error.message;
        }
        
        alert(errorMessage);
      }
    });
  };

  return (
    <div className="flex gap-3 mt-6 p-4 border rounded-lg bg-slate-50">
      <div className="flex-1 flex items-center text-sm text-muted-foreground">
        شما مسئول بررسی این درخواست هستید:
      </div>
      
      {/* دکمه تایید */}
      <Button 
        onClick={() => handleAction("APPROVE")} 
        disabled={isPending}
        className="bg-green-600 hover:bg-green-700 gap-2"
      >
        {isPending ? <Loader2 className="animate-spin h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
        تایید و ارسال به مرحله بعد
      </Button>

      {/* دکمه رد (همراه با مودال) */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive" disabled={isPending} className="gap-2">
            <XCircle className="h-4 w-4" />
            رد درخواست
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>رد درخواست خرید</DialogTitle>
            <DialogDescription>
              لطفاً دلیل رد کردن این درخواست را برای متقاضی بنویسید.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              placeholder="مثلاً: بودجه کافی نداریم..." 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>انصراف</Button>
            <Button 
                variant="destructive" 
                onClick={() => handleAction("REJECT")}
                disabled={!comment || isPending}
            >
                {isPending ? "در حال پردازش..." : "تایید رد درخواست"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}