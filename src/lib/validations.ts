import { z } from "zod";

export const createRequestSchema = z.object({
  title: z.string().min(3, "عنوان باید حداقل ۳ حرف باشد"),
  description: z.string().optional(),
  items: z.array(z.object({
    name: z.string().min(2, "نام کالا ضروری است"),
    quantity: z.coerce.number().min(1, "تعداد باید حداقل ۱ باشد"), // coerce یعنی تبدیل رشته به عدد
    link: z.string().optional(),
  })).min(1, "حداقل باید یک کالا وارد کنید"),
});

export type CreateRequestValues = z.infer<typeof createRequestSchema>;