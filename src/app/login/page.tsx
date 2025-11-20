import { db } from "@/db";
import { users } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loginAsUser } from "@/actions/auth"; // اکشنی که ساختیم
import { User, Shield, Code } from "lucide-react";

export default async function LoginPage() {
  // دریافت لیست همه کاربران از دیتابیس
  const allUsers = await db.select().from(users).orderBy(users.role);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">ورود توسعه‌دهنده</CardTitle>
          <CardDescription>
            برای تست سیستم، یکی از نقش‌های زیر را انتخاب کنید
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {allUsers.map((user) => (
            <form key={user.id} action={async () => {
              "use server";
              await loginAsUser(user.id);
            }}>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-3 h-14 text-lg hover:bg-primary/5 hover:text-primary transition-all"
                type="submit"
              >
                {/* آیکون بر اساس نقش */}
                {user.role === 'ADMIN' ? <Shield className="text-red-500" /> : 
                 user.role === 'MANAGER' ? <User className="text-blue-500" /> : 
                 <Code className="text-green-500" />}
                
                <div className="flex flex-col items-start">
                    <span className="font-bold">{user.name}</span>
                    <span className="text-xs text-muted-foreground">{user.role} | {user.email}</span>
                </div>
              </Button>
            </form>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}