import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, ShieldCheck, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      
      {/* هدر ساده */}
      <header className="p-6 flex justify-between items-center max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2 font-bold text-xl text-slate-800">
          <div className="w-10 h-10 bg-primary text-white rounded-lg flex items-center justify-center">
            PR
          </div>
          سامانه تدارکات
        </div>
        <Button variant="outline" asChild>
          <Link href="/login">ورود پرسنل</Link>
        </Button>
      </header>

      {/* بخش اصلی (Hero Section) */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center mt-10 mb-20">
        <div className="max-w-3xl space-y-6">
          <div className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-4">
            نسخه جدید: سلسله مراتب ۵ مرحله‌ای
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight">
            مدیریت هوشمند <span className="text-primary">درخواست‌های خرید</span>
          </h1>
          
          <p className="text-lg text-slate-600 md:text-xl max-w-2xl mx-auto leading-relaxed">
            سامانه جامع اتوماسیون تدارکات برای مدیریت شفاف و سریع فرآیندهای خرید سازمانی، از ثبت درخواست تا تایید نهایی مدیرعامل.
          </p>

          <div className="flex items-center justify-center gap-4 pt-4">
            <Button size="lg" className="h-12 px-8 text-lg gap-2" asChild>
              <Link href="/login">
                ورود به سامانه
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* ویژگی‌ها */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-24 w-full">
          <FeatureCard 
            icon={Zap}
            title="سرعت بالا"
            desc="گردش کار خودکار بین واحدها بدون نیاز به کاغذبازی و پیگیری حضوری."
          />
          <FeatureCard 
            icon={ShieldCheck}
            title="شفافیت کامل"
            desc="مشاهده لحظه‌ای وضعیت درخواست و تاریخچه دقیق تاییدات مدیران."
          />
          <FeatureCard 
            icon={CheckCircle2}
            title="چارت استاندارد"
            desc="رعایت دقیق سلسله مراتب سازمانی (تدارکات، اداری، مالی و مدیریت)."
          />
        </div>
      </main>

      {/* فوتر */}
      <footer className="py-6 text-center text-slate-400 text-sm border-t bg-white">
        © 2025 سامانه مدیریت خرید | توسعه داده شده با Next.js 16
      </footer>
    </div>
  );
}

// کامپوننت کوچک برای کارت‌های ویژگی
function FeatureCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <Card className="border-none shadow-md bg-white/50 hover:bg-white transition-colors">
      <CardContent className="pt-6 text-right">
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-primary">
          <Icon size={24} />
        </div>
        <h3 className="font-bold text-lg mb-2">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{desc}</p>
      </CardContent>
    </Card>
  )
}