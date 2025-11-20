"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { submitProformas } from "@/actions/approvals";
import { Loader2, Upload, DollarSign, Camera, FileText, X } from "lucide-react";
import { toast } from "sonner";

// تایپ آیتم‌ها را آپدیت کردیم تا فایل را هم نگه دارد
interface ProformaItem {
    id: number;
    supplier: string;
    price: number;
    description: string;
    fileName?: string;
    fileData?: string; // ذخیره فایل به صورت متن طولانی (Base64)
}

export function ProformaForm({ requestId }: { requestId: number }) {
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState<ProformaItem[]>([
    { id: 1, supplier: "", price: 0, description: "" },
    { id: 2, supplier: "", price: 0, description: "" },
    { id: 3, supplier: "", price: 0, description: "" },
  ]);
  const [selectedId, setSelectedId] = useState<string>("1");

  // تابع تبدیل فایل به Base64
  const handleFileUpload = (index: number, file: File | undefined) => {
    if (!file) return;

    // چک کردن حجم فایل (مثلاً حداکثر ۲ مگابایت)
    if (file.size > 2 * 1024 * 1024) {
        toast.error("حجم فایل باید کمتر از ۲ مگابایت باشد");
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const base64String = e.target?.result as string;
        const newItems = [...items];
        newItems[index].fileName = file.name;
        newItems[index].fileData = base64String;
        setItems(newItems);
    };
    reader.readAsDataURL(file);
  };

  const removeFile = (index: number) => {
      const newItems = [...items];
      newItems[index].fileName = undefined;
      newItems[index].fileData = undefined;
      setItems(newItems);
  };

  const handleSubmit = () => {
    if (items.some(i => !i.supplier || !i.price)) {
        alert("لطفاً نام فروشگاه و قیمت هر ۳ استعلام را وارد کنید");
        return;
    }

    const finalData = items.map(i => ({
        ...i,
        selected: i.id.toString() === selectedId
    }));

    startTransition(async () => {
        try {
            await submitProformas(requestId, finalData);
            toast.success("پیش‌فاکتورها با موفقیت ارسال شد");
        } catch (error: unknown) {
             // نادیده گرفتن خطای ریدایرکت
             if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) return;
             console.error(error);
             alert("خطا در آپلود اطلاعات. ممکن است حجم فایل‌ها زیاد باشد.");
        }
    });
  };

  return (
    <Card className="border-orange-400 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-orange-800 flex items-center gap-2 text-lg">
             <Upload className="w-5 h-5"/> 
             بارگذاری ۳ استعلام قیمت (الزامی)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-orange-700">
            لطفاً ۳ پیش‌فاکتور تهیه شده را وارد کرده و گزینه‌ی پیشنهادی خود را انتخاب کنید.
            می‌توانید فایل فاکتور را آپلود کنید یا عکس بگیرید.
        </p>

        <RadioGroup value={selectedId} onValueChange={setSelectedId}>
            {items.map((item, index) => (
                <div key={item.id} className={`flex flex-col sm:flex-row items-start gap-4 p-4 border rounded transition-all ${selectedId === item.id.toString() ? 'bg-green-50 border-green-500 ring-1 ring-green-500' : 'bg-white'}`}>
                    <div className="mt-3">
                        <RadioGroupItem value={item.id.toString()} id={`r-${item.id}`} />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 w-full">
                        {/* ردیف اول: نام و قیمت */}
                        <div className="space-y-4">
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1 block">نام فروشگاه/تامین‌کننده</Label>
                                <Input 
                                    placeholder="مثلاً: دیجی‌کالا" 
                                    value={item.supplier}
                                    onChange={e => {
                                        const newItems = [...items];
                                        newItems[index].supplier = e.target.value;
                                        setItems(newItems);
                                    }}
                                    className="bg-white"
                                />
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1 block">مبلغ کل (تومان)</Label>
                                <div className="relative">
                                    <DollarSign className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        type="number"
                                        placeholder="0" 
                                        value={item.price || ''}
                                        onChange={e => {
                                            const newItems = [...items];
                                            newItems[index].price = Number(e.target.value);
                                            setItems(newItems);
                                        }}
                                        className="bg-white pr-8"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ردیف دوم: توضیحات و آپلود */}
                        <div className="space-y-4">
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1 block">توضیحات / لینک</Label>
                                <Input 
                                    placeholder="توضیحات تکمیلی..." 
                                    value={item.description}
                                    onChange={e => {
                                        const newItems = [...items];
                                        newItems[index].description = e.target.value;
                                        setItems(newItems);
                                    }}
                                    className="bg-white"
                                />
                            </div>
                            
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1 block">تصویر یا فایل فاکتور</Label>
                                {!item.fileData ? (
                                    <div className="flex gap-2">
                                        {/* دکمه آپلود معمولی */}
                                        <div className="relative flex-1">
                                            <Input 
                                                type="file" 
                                                accept="image/*,application/pdf"
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                onChange={(e) => handleFileUpload(index, e.target.files?.[0])}
                                            />
                                            <Button variant="outline" className="w-full text-xs bg-white" type="button">
                                                <Upload className="w-3 h-3 ml-2" />
                                                آپلود فایل
                                            </Button>
                                        </div>
                                        
                                        {/* دکمه دوربین (مخصوص موبایل) */}
                                        <div className="relative flex-1 md:hidden">
                                            <Input 
                                                type="file" 
                                                accept="image/*"
                                                capture="environment" // 👈 فعال‌سازی دوربین پشت موبایل
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                onChange={(e) => handleFileUpload(index, e.target.files?.[0])}
                                            />
                                            <Button variant="outline" className="w-full text-xs bg-white" type="button">
                                                <Camera className="w-3 h-3 ml-2" />
                                                عکس گرفتن
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded px-3 py-2 text-xs">
                                        <div className="flex items-center gap-2 truncate max-w-[150px]">
                                            <FileText className="w-4 h-4 text-blue-500" />
                                            <span className="truncate">{item.fileName}</span>
                                        </div>
                                        <Button 
                                            type="button" 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-6 w-6 text-red-500 hover:text-red-700"
                                            onClick={() => removeFile(index)}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </RadioGroup>

        <Button onClick={handleSubmit} disabled={isPending} className="w-full bg-orange-600 hover:bg-orange-700 h-12 text-lg">
            {isPending ? <Loader2 className="animate-spin ml-2" /> : null}
            ثبت نهایی و ارسال به مدیر مالی
        </Button>
      </CardContent>
    </Card>
  );
}