import { db } from "@/db";
import { requests, requestItems, requestLogs, users } from "@/db/schema"; // users و items اضافه شدند
import { getCurrentUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApprovalActions } from "@/components/approval-actions";
import { PrintButton } from "@/components/print-button";
import { User, FileText } from "lucide-react";

// ۱. تعریف تایپ دقیق برای خروجی کوئری (جلوگیری از any)
type RequestDetailType = typeof requests.$inferSelect & {
  requester: typeof users.$inferSelect;
  items: (typeof requestItems.$inferSelect)[];
  logs: (typeof requestLogs.$inferSelect & {
    actor: typeof users.$inferSelect;
  })[];
};

// ۲. تعریف تایپ برای ورودی صفحه
type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function RequestDetailPage({ params }: PageProps) {
  const { id } = await params;
  const requestId = parseInt(id);
  
  if (isNaN(requestId)) notFound();

  const user = await getCurrentUser();
  
  // ۳. دریافت اطلاعات با تایپ‌گذاری ضمنی (Drizzle معمولا خودش تایپ رو میفهمه ولی اینجا محکم‌کاری میکنیم)
  const requestData = await db.query.requests.findFirst({
    where: eq(requests.id, requestId),
    with: {
      requester: true,
      items: true,
      logs: {
        with: { actor: true },
        orderBy: [desc(requestLogs.createdAt)]
      }
    }
  });

  if (!requestData) notFound();

  // کست کردن به تایپ دقیق (برای اینکه TS خیالش راحت بشه)
  const request = requestData as RequestDetailType;

  const isApprover = user?.id === request.currentApproverId;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 print:w-full print:max-w-none">
      
      {/* === هدر: عنوان و دکمه‌ها === */}
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold flex items-center gap-2">
            جزئیات درخواست #{request.id}
        </h1>
        <div className="flex items-center gap-2">
            {request.status === 'APPROVED' && <Badge className="bg-green-600 text-lg px-4">تایید نهایی شده</Badge>}
            {request.status === 'REJECTED' && <Badge variant="destructive" className="text-lg px-4">رد شده</Badge>}
            {request.status === 'PENDING' && <Badge className="bg-yellow-500 text-black text-lg px-4">در انتظار بررسی</Badge>}
            
            <PrintButton />
        </div>
      </div>

      <div className="hidden print:block text-center border-b pb-4 mb-4">
          <h1 className="text-2xl font-bold">فرم درخواست خرید کالا</h1>
          <p className="text-sm mt-2">شماره درخواست: {request.id}</p>
      </div>

      <div className="grid grid-cols-3 gap-6 print:block">
        <div className="col-span-2 space-y-6">
            {/* لیست کالاها */}
            <Card className="print:shadow-none print:border">
                <CardHeader>
                    <CardTitle className="text-base">لیست اقلام درخواستی</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>شرح کالا</TableHead>
                                <TableHead className="text-center">تعداد</TableHead>
                                <TableHead className="text-left">قیمت واحد</TableHead>
                                <TableHead className="text-left">جمع کل</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {request.items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell className="text-center">{item.quantity}</TableCell>
                                    <TableCell className="text-left">{item.price?.toLocaleString()}</TableCell>
                                    <TableCell className="text-left font-bold">
                                        {((item.price || 0) * item.quantity).toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <div className="flex justify-end mt-4 pt-4 border-t">
                        <div className="flex items-center gap-2 font-bold text-lg">
                            <span>جمع نهایی:</span>
                            <span>{request.totalAmount?.toLocaleString()} تومان</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {request.description && (
                <Card className="print:shadow-none print:border print:mt-4">
                    <CardHeader><CardTitle className="text-base flex gap-2"><FileText size={18}/> توضیحات تکمیلی</CardTitle></CardHeader>
                    <CardContent><p className="text-muted-foreground print:text-black">{request.description}</p></CardContent>
                </Card>
            )}

            <div className="no-print">
                {isApprover && (
                    <ApprovalActions requestId={request.id} />
                )}
            </div>
        </div>

        <div className="space-y-6 print:mt-6 print:grid print:grid-cols-2 print:gap-4">
            {/* اطلاعات درخواست کننده */}
            <Card className="print:shadow-none print:border">
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">درخواست کننده</CardTitle></CardHeader>
                <CardContent className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center print:hidden">
                        <User className="text-slate-500"/>
                    </div>
                    <div>
                        <div className="font-bold">{request.requester.name}</div>
                        <div className="text-xs text-muted-foreground print:text-black">{request.requester.email}</div>
                        <div className="text-xs text-muted-foreground mt-1 print:text-black">{request.requester.phone}</div>
                    </div>
                </CardContent>
            </Card>

            {/* تایم لاین */}
            <Card className="print:shadow-none print:border">
                <CardHeader><CardTitle className="text-sm">روند تاییدات</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {request.logs.map((log) => (
                        <div key={log.id} className="relative pl-4 border-r-2 border-slate-100 mr-2 print:border-slate-300">
                            <div className={`absolute -right-[9px] top-0 w-4 h-4 rounded-full border-2 border-white print:border-gray-300 ${
                                log.action === 'SUBMIT' ? 'bg-blue-500' : 
                                log.action === 'APPROVE' ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                            
                            <div className="text-sm font-medium">{log.actor.name}</div>
                            <div className="text-xs text-muted-foreground mb-1 print:text-black">
                                {log.action === 'SUBMIT' ? 'ثبت درخواست' : 
                                 log.action === 'APPROVE' ? 'تایید کرد' : 
                                 log.action === 'REJECT' ? 'رد کرد' : 'نظر داد'}
                            </div>
                            
                            {log.comment && (
                                <div className="text-xs bg-slate-50 p-2 rounded border mt-1 print:border-gray-300 print:bg-white">
                                    "{log.comment}"
                                </div>
                            )}
                            
                            <div className="text-[10px] text-slate-400 mt-1 text-left dir-ltr print:text-gray-500">
                                {log.createdAt ? new Date(log.createdAt).toLocaleString('fa-IR') : '-'}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
      </div>

      <div className="hidden print:flex justify-between mt-10 pt-10">
          <div className="text-center w-1/3">
              <p className="font-bold mb-10">امضای متقاضی</p>
              <p>________________</p>
          </div>
          <div className="text-center w-1/3">
              <p className="font-bold mb-10">امضای مدیر فنی</p>
              <p>________________</p>
          </div>
          <div className="text-center w-1/3">
              <p className="font-bold mb-10">امضای مدیریت عامل</p>
              <p>________________</p>
          </div>
      </div>
    </div>
  );
}