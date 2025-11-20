import { db } from "@/db";
import { requests, requestLogs, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { eq, desc, inArray } from "drizzle-orm";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Archive, ListChecks, FileInput } from "lucide-react";
import Link from "next/link";

// ✅ اصلاح تایپ: اضافه کردن proformaData و اصلاح requester
type RequestType = typeof requests.$inferSelect & {
  requester: typeof users.$inferSelect | null; // ممکن است null باشد
  proformaData?: unknown; // فیلد جدید JSON
};

function getStatusBadge(status: string | null) {
  switch (status) {
    case "APPROVED": return <Badge className="bg-green-600">تایید نهایی</Badge>;
    case "REJECTED": return <Badge variant="destructive">رد شده</Badge>;
    case "WAITING_FOR_PROFORMA": return <Badge className="bg-orange-500">منتظر پیش‌فاکتور</Badge>; // وضعیت جدید
    case "PENDING": return <Badge className="bg-yellow-500 text-black">در جریان</Badge>;
    default: return <Badge variant="secondary">پیش‌نویس</Badge>;
  }
}

export default async function RequestsListPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // ۱. کارتابل جاری (باید اقدام کنم)
  const pendingForMe = await db.query.requests.findMany({
    where: eq(requests.currentApproverId, user.id),
    with: { requester: true },
    orderBy: [desc(requests.createdAt)],
  });

  // ۲. درخواست‌های خودم (من ایجاد کردم)
  const myRequests = await db.query.requests.findMany({
    where: eq(requests.requesterId, user.id),
    orderBy: [desc(requests.createdAt)],
  });

  // ۳. آرشیو (درخواست‌هایی که من روی آن‌ها اکشن انجام داده‌ام)
  const myLogs = await db.select({ requestId: requestLogs.requestId })
    .from(requestLogs)
    .where(eq(requestLogs.actorId, user.id));
  
  const logRequestIds = myLogs.map(l => l.requestId);
  
  let archivedRequests: RequestType[] = [];
  
  if (logRequestIds.length > 0) {
    const uniqueIds = Array.from(new Set(logRequestIds));
    
    // اینجا تایپ دقیق استفاده می‌شود تا ارور ندهد
    const results = await db.query.requests.findMany({
      where: inArray(requests.id, uniqueIds),
      with: { requester: true },
      orderBy: [desc(requests.createdAt)],
    });

    archivedRequests = results as RequestType[];
  }

  // حذف درخواست‌های خودم از آرشیو (برای جلوگیری از تکرار)
  const processedByMe = archivedRequests.filter(req => req.requesterId !== user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">مدیریت درخواست‌ها</h1>
      </div>

      <Tabs defaultValue="inbox" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="inbox">کارتابل ({pendingForMe.length})</TabsTrigger>
          <TabsTrigger value="archive">آرشیو تاییدات</TabsTrigger>
          <TabsTrigger value="my-requests">درخواست‌های من</TabsTrigger>
        </TabsList>

        {/* تب ۱: کارتابل */}
        <TabsContent value="inbox" className="mt-4">
          <Card className={pendingForMe.length > 0 ? "border-blue-200 bg-blue-50/30" : ""}>
            <CardHeader><CardTitle className="flex items-center gap-2"><ListChecks/> نیاز به اقدام شما</CardTitle></CardHeader>
            <CardContent>
                {pendingForMe.length === 0 ? <p className="text-muted-foreground text-center py-8">کارتابل شما خالی است.</p> : 
                 <RequestsTable data={pendingForMe as RequestType[]} showAction={true} />
                }
            </CardContent>
          </Card>
        </TabsContent>

        {/* تب ۲: آرشیو */}
        <TabsContent value="archive" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Archive/> سابقه‌ی بررسی‌های شما</CardTitle></CardHeader>
            <CardContent>
                {processedByMe.length === 0 ? <p className="text-muted-foreground text-center py-8">شما هنوز درخواستی را بررسی نکرده‌اید.</p> : 
                 <RequestsTable data={processedByMe} showAction={false} />
                }
            </CardContent>
          </Card>
        </TabsContent>

        {/* تب ۳: درخواست‌های من */}
        <TabsContent value="my-requests" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileInput/> درخواست‌های ثبت شده توسط شما</CardTitle></CardHeader>
            <CardContent>
                 <RequestsTable data={myRequests as RequestType[]} showAction={true} isMyRequest={true} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// کامپوننت جدول
function RequestsTable({ data, showAction, isMyRequest }: { data: RequestType[], showAction: boolean, isMyRequest?: boolean }) {
    return (
        <Table>
        <TableHeader>
          <TableRow>
            {!isMyRequest && <TableHead>درخواست کننده</TableHead>}
            <TableHead>عنوان</TableHead>
            <TableHead>وضعیت</TableHead>
            <TableHead>مبلغ (تومان)</TableHead>
            <TableHead>تاریخ</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((req) => (
            <TableRow key={req.id}>
              {!isMyRequest && (
                  <TableCell className="font-medium">
                      {req.requester?.name ?? 'نامشخص'}
                  </TableCell>
              )}
              <TableCell>{req.title}</TableCell>
              <TableCell>{getStatusBadge(req.status)}</TableCell>
              <TableCell>{req.totalAmount?.toLocaleString()}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {req.createdAt ? new Date(req.createdAt).toLocaleDateString('fa-IR') : '-'}
              </TableCell>
              <TableCell>
                <Button variant={showAction ? "default" : "ghost"} size="sm" asChild>
                  <Link href={`/dashboard/requests/${req.id}`}>
                    {showAction && !isMyRequest ? "بررسی" : "مشاهده"}
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
}