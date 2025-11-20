import { db } from "@/db";
import { users } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loginAsUser } from "@/actions/auth";
import { 
  User, 
  ShieldCheck, 
  Package, 
  Briefcase, 
  Calculator, 
  Crown,
  ArrowLeft
} from "lucide-react";

// ترتیب دقیق نمایش در صفحه لاگین (طبق درخواست شما)
const SORT_ORDER = [
  'USER',            // ۱. درخواست کننده
  'MANAGER',         // ۲. مدیر مربوطه
  'PROCUREMENT',     // ۳. تدارکات
  'ADMIN_MANAGER',   // ۴. مدیر اداری
  'FINANCE_MANAGER', // ۵. مدیر مالی
  'CEO'              // ۶. مدیر عامل
];

const getRoleDetails = (role: string | null) => {
  switch (role) {
    case 'CEO':
      return { label: 'مدیر عامل', icon: Crown, color: 'text-yellow-600', bg: 'bg-yellow-50' };
    case 'FINANCE_MANAGER':
      return { label: 'مدیر مالی', icon: Calculator, color: 'text-purple-600', bg: 'bg-purple-50' };
    case 'ADMIN_MANAGER':
      return { label: 'مدیر اداری', icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-50' };
    case 'PROCUREMENT':
      return { label: 'تدارکات و انبار', icon: Package, color: 'text-orange-600', bg: 'bg-orange-50' };
    case 'MANAGER':
      return { label: 'مدیر مستقیم (فنی)', icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50' };
    case 'USER':
    default:
      return { label: 'کارمند (درخواست کننده)', icon: User, color: 'text-slate-600', bg: 'bg-slate-50' };
  }
};

export default async function LoginPage() {
  // دریافت همه کاربران
  const allUsers = await db.query.users.findMany();

  // مرتب‌سازی دستی بر اساس آرایه SORT_ORDER
  const sortedUsers = allUsers.sort((a, b) => {
    const indexA = SORT_ORDER.indexOf(a.role || '');
    const indexB = SORT_ORDER.indexOf(b.role || '');
    return indexA - indexB;
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 p-4" dir="rtl">
      <Card className="w-full max-w-lg shadow-xl border-t-4 border-t-primary">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-3xl font-bold text-slate-800">ورود به سامانه تدارکات</CardTitle>
          <CardDescription className="text-lg mt-2">
            گردش کار: از بالا (درخواست) شروع کنید تا پایین (تایید نهایی)
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-6">
          {sortedUsers.map((user, index) => {
            const { label, icon: Icon, color, bg } = getRoleDetails(user.role);
            
            return (
              <div key={user.id} className="relative">
                {/* خط اتصال بین مراحل (به جز آخرین نفر) */}
                {index !== sortedUsers.length - 1 && (
                  <div className="absolute right-8 top-10 bottom-[-20px] w-0.5 bg-slate-300 -z-10" />
                )}
                
                <form action={async () => {
                  "use server";
                  await loginAsUser(user.id);
                }}>
                  <Button 
                    variant="outline" 
                    className={`w-full h-auto py-3 px-4 flex items-center justify-between hover:border-primary transition-all group ${bg}`}
                    type="submit"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full bg-white shadow-sm border border-slate-100 ${color}`}>
                          <Icon size={20} />
                      </div>
                      <div className="flex flex-col items-start text-right">
                          <span className="font-bold text-base text-slate-800">{user.name}</span>
                          <span className="text-xs text-muted-foreground font-medium mt-0.5">{label}</span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                        ورود
                        <ArrowLeft size={14} />
                    </div>
                  </Button>
                </form>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}