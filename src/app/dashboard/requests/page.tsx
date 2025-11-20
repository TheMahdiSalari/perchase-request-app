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
import { ExcelExportButton } from "@/components/excel-export-button";

type RequestType = typeof requests.$inferSelect & {
  requester: typeof users.$inferSelect | null;
  proformaData?: unknown;
};

function getStatusBadge(status: string | null) {
  switch (status) {
    case "APPROVED": return <Badge className="bg-green-600">تایید نهایی</Badge>;
    case "REJECTED": return <Badge variant="destructive">رد شده</Badge>;
    case "WAITING_FOR_PROFORMA": return <Badge className="bg-orange-500">منتظر پیش‌فاکتور</Badge>;
    case "PENDING": return <Badge className="bg-yellow-500 text-black">در جریان</Badge>;
    default: return <Badge variant="secondary">پیش‌نویس</Badge>;
  }
}

export default async function RequestsListPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const pendingForMe = await db.query.requests.findMany({
    where: eq(requests.currentApproverId, user.id),
    with: { requester: true },
    orderBy: [desc(requests.createdAt)],
  });

  const myRequests = await db.query.requests.findMany({
    where: eq(requests.requesterId, user.id),
    with: { requester: true },
    orderBy: [desc(requests.createdAt)],
  });

  const myLogs = await db.select({ requestId: requestLogs.requestId })
    .from(requestLogs)
    .where(eq(requestLogs.actorId, user.id));
  
  const logRequestIds = myLogs.map(l => l.requestId);
  let archivedRequests: RequestType[] = [];
  
  if (logRequestIds.length > 0) {
    const uniqueIds = Array.from(new Set(logRequestIds));
    const results = await db.query.requests.findMany({
      where: inArray(requests.id, uniqueIds),
      with: { requester: true },
      orderBy: [desc(requests.createdAt)],
    });
    archivedRequests = results as RequestType[];
  }

  const processedByMe = archivedRequests.filter(req => req.requesterId !== user.id);

  const allAccessibleRequests = [...processedByMe, ...myRequests, ...pendingForMe];
  const uniqueRequestsMap = new Map();
  allAccessibleRequests.forEach(item => uniqueRequestsMap.set(item.id, item));
  const uniqueRequests = Array.from(uniqueRequestsMap.values()) as RequestType[];
  
  // مبلغ در اکسل همچنان باقی می‌ماند
  const excelData = uniqueRequests.filter(req => req.status === 'APPROVED');
  const showExcelButton = user.role === 'FINANCE_MANAGER' || user.role === 'CEO';

  return (
    <div className="space-y-6" dir="rtl">
      
      <div className="flex items-center justify-between w-full">
        <h1 className="text-2xl font-bold text-slate-800">مدیریت درخواست‌ها</h1>
        
        {showExcelButton && (
            <ExcelExportButton 
                data={excelData} 
                filename="Gozaresh-Kharid" 
            />
        )}
      </div>

      <Tabs defaultValue="inbox" className="w-full" dir="rtl">
        
        <div className="flex justify-start mb-4">
            <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                <TabsTrigger value="inbox">کارتابل ({pendingForMe.length})</TabsTrigger>
                <TabsTrigger value="archive">آرشیو تاییدات</TabsTrigger>
                <TabsTrigger value="my-requests">درخواست‌های من</TabsTrigger>
            </TabsList>
        </div>

        <TabsContent value="inbox" className="mt-0">
          <Card className={pendingForMe.length > 0 ? "border-blue-200 bg-blue-50/30" : ""}>
            <CardHeader><CardTitle className="flex items-center gap-2 text-right"><ListChecks/> نیاز به اقدام شما</CardTitle></CardHeader>
            <CardContent>
                {pendingForMe.length === 0 ? <p className="text-muted-foreground text-center py-8">کارتابل شما خالی است.</p> : 
                 <RequestsTable data={pendingForMe as RequestType[]} showAction={true} />
                }
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archive" className="mt-0">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-right"><Archive/> سابقه‌ی بررسی‌های شما</CardTitle></CardHeader>
            <CardContent>
                {processedByMe.length === 0 ? <p className="text-muted-foreground text-center py-8">شما هنوز درخواستی را بررسی نکرده‌اید.</p> : 
                 <RequestsTable data={processedByMe} showAction={false} />
                }
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-requests" className="mt-0">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-right"><FileInput/> درخواست‌های ثبت شده توسط شما</CardTitle></CardHeader>
            <CardContent>
                 <RequestsTable data={myRequests as RequestType[]} showAction={true} isMyRequest={true} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RequestsTable({ data, showAction, isMyRequest }: { data: RequestType[], showAction: boolean, isMyRequest?: boolean }) {
    return (
        <Table>
        <TableHeader>
          <TableRow>
            {!isMyRequest && <TableHead className="text-right w-[20%]">درخواست کننده</TableHead>}
            <TableHead className="text-right w-[25%]">عنوان</TableHead>
            <TableHead className="text-right w-[20%]">وضعیت</TableHead>
            {/* ستون مبلغ حذف شد */}
            <TableHead className="text-right w-[20%]">تاریخ</TableHead>
            <TableHead className="text-center w-[15%]">عملیات</TableHead> 
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((req) => (
            <TableRow key={req.id}>
              {!isMyRequest && (
                  <TableCell className="font-medium text-right">
                      {req.requester?.name ?? 'نامشخص'}
                  </TableCell>
              )}
              <TableCell className="text-right">{req.title}</TableCell>
              <TableCell className="text-right">{getStatusBadge(req.status)}</TableCell>
              {/* ستون مبلغ حذف شد */}
              <TableCell className="text-sm text-muted-foreground text-right">
                {req.createdAt ? new Date(req.createdAt).toLocaleDateString('fa-IR') : '-'}
              </TableCell>
              <TableCell className="text-center">
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