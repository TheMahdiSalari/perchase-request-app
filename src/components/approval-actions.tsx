"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import { processRequest } from "@/actions/approvals";
import { CheckCircle, XCircle, Loader2, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

// اضافه کردن prop جدید: role
export function ApprovalActions({ requestId, userRole }: { requestId: number, userRole?: string }) {
  const [isPending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [proformaOpen, setProformaOpen] = useState(false); // مودال جدید برای پیش فاکتور
  const [comment, setComment] = useState("");

  const handleAction = (action: "APPROVE" | "REJECT" | "REQUEST_PROFORMA") => {
    startTransition(async () => {
      try {
        await processRequest(requestId, action, comment);
        toast.success("عملیات انجام شد");
      } catch (error: unknown) {
        if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) return;
        console.error(error);
        alert("خطا در عملیات");
      }
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 mt-6 p-4 border rounded-lg bg-slate-50 items-center">
      <div className="flex-1 text-sm text-muted-foreground font-medium">
        عملیات مدیریت:
      </div>
      
      {/* دکمه تایید (سبز) */}
      <Button 
        onClick={() => handleAction("APPROVE")} 
        disabled={isPending}
        className="bg-green-600 hover:bg-green-700 gap-2 flex-1 sm:flex-none"
      >
        {isPending ? <Loader2 className="animate-spin h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
        تایید درخواست
      </Button>

      {/* دکمه درخواست پیش‌فاکتور (زرد) - فقط برای مدیر مالی */}
      {userRole === 'FINANCE_MANAGER' && (
          <Dialog open={proformaOpen} onOpenChange={setProformaOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50 gap-2 flex-1 sm:flex-none">
                <RefreshCcw className="h-4 w-4" />
                درخواست پیش‌فاکتور
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>عودت به تدارکات</DialogTitle>
                <DialogDescription>
                    این درخواست جهت اخذ ۳ استعلام قیمت به مسئول تدارکات بازگردانده می‌شود.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Textarea 
                  placeholder="توضیحات برای مسئول تدارکات..." 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setProformaOpen(false)}>انصراف</Button>
                <Button onClick={() => handleAction("REQUEST_PROFORMA")} className="bg-orange-600 hover:bg-orange-700">
                    ارسال به تدارکات
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
      )}

      {/* دکمه رد (قرمز) */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive" disabled={isPending} className="gap-2 flex-1 sm:flex-none">
            <XCircle className="h-4 w-4" />
            رد
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>رد درخواست</DialogTitle>
            <DialogDescription>دلیل رد شدن درخواست را بنویسید.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              placeholder="علت رد..." 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>انصراف</Button>
            <Button variant="destructive" onClick={() => handleAction("REJECT")} disabled={!comment}>
                تایید رد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}