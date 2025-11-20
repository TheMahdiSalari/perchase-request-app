"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createRequestSchema, CreateRequestValues } from "@/lib/validations";
import { submitRequest } from "@/actions/requests";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function RequestForm() {
  const [isPending, startTransition] = useTransition();

  // اصلاح ۱: حذف جنریک <CreateRequestValues> برای رفع ارور تایپ‌اسکریپت
  const form = useForm({
    resolver: zodResolver(createRequestSchema),
    defaultValues: {
      title: "",
      description: "",
      items: [{ name: "", quantity: 1, price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  function onSubmit(data: CreateRequestValues) {
    startTransition(async () => {
      try {
        await submitRequest(data);
        // موفقیت
      } catch (error: unknown) { // 👈 تغییر به unknown (قانون جدید)
        
        // ۱. چک کردن اینکه آیا ارور از نوع آبجکت استاندارد است؟
        if (error instanceof Error) {
            // چک کردن خطای ریدایرکت نکست جی‌اس
            if (error.message === "NEXT_REDIRECT" || error.message.includes("NEXT_REDIRECT")) {
                return;
            }
        }

        console.error(error);
        
        let errorMessage = "خطای ناشناخته رخ داد";

        // ۲. استخراج متن خطا به صورت ایمن
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === "string") {
            errorMessage = error;
        }

        alert(errorMessage);
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-3xl mx-auto">
        
        {/* بخش اطلاعات کلی */}
        <Card>
            <CardContent className="pt-6 space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>عنوان درخواست</FormLabel>
                      <FormControl>
                        <Input placeholder="مثلاً: خرید تجهیزات شبکه" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>توضیحات (اختیاری)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="توضیحات تکمیلی و ضرورت خرید..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </CardContent>
        </Card>

        {/* بخش آیتم‌های خرید (داینامیک) */}
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">لیست کالاها</h3>
                <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    // هنگام افزودن، مقادیر پیش‌فرض معتبر می‌دهیم
                    onClick={() => append({ name: "", quantity: 1, price: 0 })}
                >
                    <Plus className="w-4 h-4 ml-2" />
                    افزودن کالا
                </Button>
            </div>

            {fields.map((fieldItem, index) => (
                <Card key={fieldItem.id}>
                    <CardContent className="pt-6 flex gap-4 items-end">
                        <div className="grid grid-cols-12 gap-4 flex-1">
                            {/* نام کالا */}
                            <div className="col-span-5">
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.name`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs">نام کالا</FormLabel>
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                            </div>

                            {/* تعداد (اصلاح شده) */}
                            <div className="col-span-2">
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.quantity`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs">تعداد</FormLabel>
                                      <FormControl>
                                        <Input 
                                            type="number" 
                                            {...field} 
                                            // اصلاح ۲: کست کردن مقدار به نامبر برای رفع ارور unknown
                                            value={field.value as number}
                                            // تبدیل رشته به عدد هنگام تایپ
                                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                            </div>

                            {/* قیمت (اصلاح شده) */}
                            <div className="col-span-3">
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.price`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs">قیمت واحد</FormLabel>
                                      <FormControl>
                                        <Input 
                                            type="number" 
                                            {...field}
                                            value={field.value as number}
                                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                            </div>

                            {/* دکمه حذف */}
                            <div className="col-span-2 flex items-end pb-1">
                                {index > 0 && (
                                    <Button 
                                        type="button" 
                                        variant="destructive" 
                                        size="icon" 
                                        onClick={() => remove(index)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              در حال ثبت...
            </>
          ) : (
            "ارسال درخواست برای تایید"
          )}
        </Button>
      </form>
    </Form>
  );
}