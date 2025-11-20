import { RequestForm } from "@/components/forms/request-form";

export default function NewRequestPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ثبت درخواست جدید</h1>
        <p className="text-muted-foreground">
          لطفاً اقلام مورد نیاز خود را با دقت وارد کنید. درخواست شما مستقیماً برای مدیر ارسال می‌شود.
        </p>
      </div>
      <RequestForm />
    </div>
  );
}