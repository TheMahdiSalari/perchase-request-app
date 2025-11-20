"use client";

import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

// ۱. تعریف ساختار دقیق داده‌هایی که قرار است اکسل شوند
// این جایگزین any می‌شود
interface ExportItem {
  id: number;
  title: string;
  status: string | null;
  totalAmount: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  requester: { name: string } | null;
  [key: string]: unknown; // برای انعطاف‌پذیری بیشتر اگر فیلد اضافی بود
}

interface ExcelExportButtonProps {
  data: ExportItem[]; // 👈 استفاده از تایپ دقیق به جای any[]
  filename?: string;
}

export function ExcelExportButton({ data, filename = "requests-export" }: ExcelExportButtonProps) {
  
  const handleExport = () => {
    if (!data || data.length === 0) {
      alert("داده‌ای برای خروجی وجود ندارد");
      return;
    }

    // ۲. مپ کردن داده‌ها با تایپ ایمن
    const excelData = data.map((item) => ({
      "شناسه درخواست": item.id,
      "عنوان": item.title,
      "درخواست کننده": item.requester?.name ?? "نامشخص",
      "وضعیت": translateStatus(item.status),
      "مبلغ کل (تومان)": item.totalAmount ?? 0,
      "تاریخ ایجاد": item.createdAt ? new Date(item.createdAt).toLocaleDateString('fa-IR') : "-",
      "تاریخ آخرین تغییر": item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('fa-IR') : "-"
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    
    if(!workbook.Workbook) workbook.Workbook = {};
    if(!workbook.Workbook.Views) workbook.Workbook.Views = [];
    if(!workbook.Workbook.Views[0]) workbook.Workbook.Views[0] = {};
    workbook.Workbook.Views[0].RTL = true;

    XLSX.utils.book_append_sheet(workbook, worksheet, "درخواست‌ها");

    XLSX.writeFile(workbook, `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <Button variant="outline" className="gap-2 text-green-700 border-green-200 hover:bg-green-50" onClick={handleExport}>
      <FileSpreadsheet className="w-4 h-4" />
      خروجی اکسل
    </Button>
  );
}

// ۳. اصلاح ورودی تابع برای پذیرش null
function translateStatus(status: string | null) {
    switch (status) {
        case "APPROVED": return "تایید نهایی";
        case "REJECTED": return "رد شده";
        case "PENDING": return "در جریان";
        case "WAITING_FOR_PROFORMA": return "منتظر استعلام";
        default: return "پیش‌نویس";
    }
}