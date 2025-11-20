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
import { toast } from "sonner";

export function ApprovalActions({ requestId }: { requestId: number }) {
  const [isPending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [comment, setComment] = useState("");

  const handleAction = (action: "APPROVE" | "REJECT") => {
    startTransition(async () => {
      try {
        await processRequest(requestId, action, comment);
        toast.success("عملیات با موفقیت انجام شد");
      } catch (error) {
        alert("خطا در انجام عملیات");
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
        className="bg-green-600 hover:bg-green-700"
      >
        {isPending ? <Loader2 className="animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
        تایید و ارسال به مرحله بعد
      </Button>

      {/* دکمه رد (همراه با مودال) */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive" disabled={isPending}>
            <XCircle className="mr-2 h-4 w-4" />
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