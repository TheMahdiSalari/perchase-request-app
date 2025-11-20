import { db } from "@/db";
import { requests, requestItems, requestLogs, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApprovalActions } from "@/components/approval-actions";
import { PrintButton } from "@/components/print-button";
import { ProformaForm } from "@/components/proforma-form";
import { User, FileText, AlertCircle, Check, Download } from "lucide-react";

// ۱. تعریف دقیق ساختار دیتای پیش‌فاکتور (JSON)
interface ProformaItem {
    id: number;
    supplier: string;
    price: number;
    description: string;
    selected: boolean;
    fileName?: string;
    fileData?: string; // Base64 string
}

// ۲. آپدیت تایپ کلی درخواست
type RequestDetailType = typeof requests.$inferSelect & {
  requester: typeof users.$inferSelect;
  items: (typeof requestItems.$inferSelect)[];
  logs: (typeof requestLogs.$inferSelect & { actor: typeof users.$inferSelect; })[];
  proformaData: unknown; // در دیتابیس json است و ما کست می‌کنیم
};

type PageProps = { params: Promise<{ id: string }>; };

export default async function RequestDetailPage({ params }: PageProps) {
  const { id } = await params;
  const requestId = parseInt(id);
  if (isNaN(requestId)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect("/login");
  
  // ۳. دریافت اطلاعات از دیتابیس
  const requestData = await db.query.requests.findFirst({
    where: eq(requests.id, requestId),
    with: {
      requester: true,
      items: true,
      logs: { with: { actor: true }, orderBy: [desc(requestLogs.createdAt)] }
    }
  });

  if (!requestData) notFound();
  const request = requestData as RequestDetailType;

  // ۴. بررسی دسترسی‌ها
  const isApprover = user.id === request.currentApproverId;
  const isRequester = user.id === request.requesterId;
  const isInHistory = request.logs.some(log => log.actorId === user.id);
  const isAdmin = user.role === 'CEO' || user.role === 'ADMIN_MANAGER' || user.role === 'FINANCE_MANAGER';
  const canView = isApprover || isRequester || isInHistory || isAdmin;

  if (!canView) {
    return (
        <div className="flex flex-col items-center justify-center h-96 text-center">
            <div className="bg-red-100 p-4 rounded-full mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-red-900">عدم دسترسی</h2>
            <p className="text-slate-600 mt-2">شما مجوز مشاهده این درخواست را ندارید.</p>
        </div>
    );
  }

  // ۵. تبدیل دیتای JSON به آرایه تایپ‌شده
  const proformas = (request.proformaData as ProformaItem[]) || [];

  // ۶. تابع کمکی برای چاپ (امضاها)
  const getSigner = (role: string) => {
    if (role === 'USER') return { name: request.requester.name, date: request.createdAt, action: 'ثبت' };
    const log = request.logs.find(l => l.actor.role === role && l.action === 'APPROVE');
    if (log) return { name: log.actor.name, date: log.createdAt, action: 'تایید' };
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 print:w-full print:max-w-none">
      
      {/* === هدر صفحه === */}
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold flex items-center gap-2">درخواست #{request.id}</h1>
        <div className="flex items-center gap-2">
            {request.status === 'WAITING_FOR_PROFORMA' && <Badge className="bg-orange-500 text-white px-3 py-1">منتظر استعلام قیمت</Badge>}
            {request.status === 'APPROVED' && <Badge className="bg-green-600 px-3 py-1">تایید نهایی</Badge>}
            {request.status === 'REJECTED' && <Badge variant="destructive" className="px-3 py-1">رد شده</Badge>}
            {request.status === 'PENDING' && <Badge className="bg-yellow-500 text-black px-3 py-1">در جریان</Badge>}
            <PrintButton />
        </div>
      </div>

      {/* === بدنه اصلی (نمایش در مانیتور) === */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
          <div className="col-span-2 space-y-6">
            
            {/* لیست کالاها */}
            <Card>
                <CardHeader><CardTitle>لیست اقلام درخواستی</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>شرح کالا</TableHead>
                                <TableHead className="text-center">تعداد</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {request.items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell className="text-center">{item.quantity}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* === جدول نتایج استعلام (اگر وجود داشته باشد) === */}
            {proformas.length > 0 && (
                <Card className="border-green-600 bg-green-50/40">
                    <CardHeader><CardTitle className="text-base text-green-800 flex items-center gap-2"><Check className="w-4 h-4"/> نتایج استعلام قیمت (تدارکات)</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>فروشگاه</TableHead>
                                    <TableHead>قیمت (تومان)</TableHead>
                                    <TableHead>توضیحات</TableHead>
                                    <TableHead>فایل</TableHead>
                                    <TableHead>وضعیت</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {proformas.map((pf) => (
                                    <TableRow key={pf.id} className={pf.selected ? "bg-green-100 font-bold" : ""}>
                                        <TableCell>{pf.supplier}</TableCell>
                                        <TableCell>{pf.price.toLocaleString()}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{pf.description}</TableCell>
                                        <TableCell>
                                            {pf.fileData ? (
                                                <a 
                                                    href={pf.fileData} 
                                                    download={pf.fileName || "invoice.jpg"}
                                                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                                                    title="دانلود فایل ضمیمه"
                                                >
                                                    <Download className="w-3 h-3" />
                                                    دانلود
                                                </a>
                                            ) : <span className="text-muted-foreground text-xs">-</span>}
                                        </TableCell>
                                        <TableCell>
                                            {pf.selected && <Badge className="bg-green-600 hover:bg-green-600 text-[10px]">منتخب</Badge>}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {/* نمایش قیمت نهایی منتخب */}
                        <div className="mt-4 pt-4 border-t border-green-200 text-right font-bold text-green-900">
                            قیمت نهایی تایید شده: {request.totalAmount?.toLocaleString()} تومان
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* توضیحات درخواست */}
            {request.description && (
                <Card><CardContent className="pt-6"><p className="text-muted-foreground"><span className="font-bold text-black">توضیحات متقاضی:</span> {request.description}</p></CardContent></Card>
            )}

            {/* === فرم آپلود پیش‌فاکتور (فقط برای تدارکات) === */}
            {isApprover && request.status === 'WAITING_FOR_PROFORMA' && user.role === 'PROCUREMENT' && (
                <ProformaForm requestId={request.id} />
            )}
            
            {/* === دکمه‌های تایید/رد (اگر منتظر پیش‌فاکتور نباشیم) === */}
            {isApprover && request.status !== 'WAITING_FOR_PROFORMA' && (
                <ApprovalActions requestId={request.id} userRole={user.role || undefined} />
            )}
          </div>
          
          {/* سایدبار اطلاعات */}
          <div className="space-y-6">
             <Card>
                <CardContent className="pt-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center"><User className="text-slate-500"/></div>
                    <div><div className="font-bold">{request.requester.name}</div><div className="text-xs text-muted-foreground">{request.requester.email}</div></div>
                </CardContent>
             </Card>
             
             <Card>
                <CardHeader><CardTitle className="text-sm">روند تاییدات</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {request.logs.map((log) => (
                        <div key={log.id} className="relative pr-6 pl-4 border-r-2 border-slate-100 mr-2">
                            <div className={`absolute -right-[9px] top-0 w-4 h-4 rounded-full border-2 border-white ${
                                log.action === 'SUBMIT' ? 'bg-blue-500' : log.action === 'APPROVE' ? 'bg-green-500' : log.action === 'REQUEST_PROFORMA' ? 'bg-orange-500' : 'bg-red-500'
                            }`}></div>
                            <div className="text-sm font-medium">{log.actor.name}</div>
                            <div className="text-xs text-muted-foreground mb-1">
                                {log.action === 'SUBMIT' ? 'ثبت درخواست' : log.action === 'APPROVE' ? 'تایید کرد' : log.action === 'REQUEST_PROFORMA' ? 'درخواست پیش‌فاکتور' : 'رد کرد'}
                            </div>
                            {log.comment && <div className="text-xs bg-slate-50 p-2 rounded border mt-1">&quot;{log.comment}&quot;</div>}
                            <div className="text-[10px] text-slate-400 mt-1 text-left dir-ltr">{log.createdAt ? new Date(log.createdAt).toLocaleString('fa-IR') : '-'}</div>
                        </div>
                    ))}
                </CardContent>
             </Card>
          </div>
      </div>

      {/* === نمای چاپی (PDF) === */}
      <div id="print-section" className="hidden print:block font-serif text-black" dir="rtl">
        <div className="border-2 border-black mb-1">
            <div className="flex justify-between items-stretch">
                <div className="w-1/3 border-l border-black p-2 flex flex-col items-center justify-center text-center">
                    <h2 className="font-bold text-sm mb-1">شرکت سلامت بهداشت و درمان</h2>
                    <h3 className="font-bold text-sm">صنعت و معدن نوین</h3>
                </div>
                <div className="w-1/3 flex items-center justify-center p-2">
                    <h1 className="font-bold text-xl underline decoration-2 underline-offset-4">فرم درخواست خرید کالا</h1>
                </div>
                <div className="w-1/3 border-r border-black text-sm">
                    <div className="border-b border-black p-1 flex justify-between">
                        <span>کد مدرک:</span>
                        <span className="font-mono">PR-{request.id}</span>
                    </div>
                    <div className="border-b border-black p-1 flex justify-between">
                        <span>تاریخ:</span>
                        <span>{request.createdAt ? new Date(request.createdAt).toLocaleDateString('fa-IR') : '-'}</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="border-2 border-black border-t-0 mb-1">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border-b border-l border-black p-1 w-12 text-center">ردیف</th>
                        <th className="border-b border-l border-black p-1 text-right">شرح کالا</th>
                        <th className="border-b border-l border-black p-1 w-20 text-center">تعداد</th>
                        <th className="border-b border-l border-black p-1 w-20 text-center">واحد</th>
                        <th className="border-b border-black p-1 w-1/3 text-right">توضیحات</th>
                    </tr>
                </thead>
                <tbody>
                    {request.items.map((item, idx) => (
                        <tr key={item.id}>
                            <td className="border-b border-l border-black p-2 text-center">{idx + 1}</td>
                            <td className="border-b border-l border-black p-2 font-bold">{item.name}</td>
                            <td className="border-b border-l border-black p-2 text-center">{item.quantity}</td>
                            <td className="border-b border-l border-black p-2 text-center">عدد</td>
                            <td className="border-b border-black p-2 text-xs text-gray-600">
                                {idx === 0 ? request.description : ''}
                            </td>
                        </tr>
                    ))}
                     {/* فضای خالی برای پر کردن فرم */}
                     {[...Array(Math.max(0, 5 - request.items.length))].map((_, i) => (
                        <tr key={`empty-${i}`}>
                            <td className="border-b border-l border-black p-4">&nbsp;</td>
                            <td className="border-b border-l border-black p-4"></td>
                            <td className="border-b border-l border-black p-4"></td>
                            <td className="border-b border-l border-black p-4"></td>
                            <td className="border-b border-black p-4"></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* باکس امضاها */}
        <div className="border-2 border-black text-xs">
            <div className="grid grid-cols-6 divide-x divide-x-reverse divide-black">
                {['USER', 'MANAGER', 'PROCUREMENT', 'ADMIN_MANAGER', 'FINANCE_MANAGER', 'CEO'].map((role) => {
                    const signer = getSigner(role);
                    const titles: Record<string, string> = {
                        'USER': 'درخواست کننده', 'MANAGER': 'مدیر مربوطه', 'PROCUREMENT': 'مسئول تدارکات',
                        'ADMIN_MANAGER': 'مدیر اداری', 'FINANCE_MANAGER': 'مدیر مالی', 'CEO': 'مدیر عامل'
                    };
                    return (
                        <div key={role} className="h-32 flex flex-col relative">
                            <div className="bg-gray-100 border-b border-black p-1 text-center font-bold">{titles[role]}</div>
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-1">
                                {signer ? (
                                    <>
                                        <span className="font-bold text-sm mb-1">{signer.name}</span>
                                        <span className="text-[10px] text-green-700">{role === 'CEO' ? 'تایید نهایی' : 'تایید دیجیتال'}</span>
                                        <span className="text-[10px]">{new Date(signer.date!).toLocaleDateString('fa-IR')}</span>
                                    </>
                                ) : <span className="text-gray-300 mt-8">ناقص</span>}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
        
        {/* نمایش مبلغ تایید شده در چاپ */}
        {request.totalAmount && request.totalAmount > 0 ? (
            <div className="mt-2 text-sm font-bold border border-black p-2 text-center">
                مبلغ نهایی تایید شده جهت خرید: {request.totalAmount.toLocaleString()} تومان
            </div>
        ) : null}

      </div>
    </div>
  );
}