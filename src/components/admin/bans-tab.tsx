"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Ban,
  Check,
  AlertTriangle,
} from "lucide-react";
import { formatArabicDate } from "@/lib/format";

type BannedUser = {
  id: string;
  username: string;
  email: string;
  phone: string | null;
  city: string | null;
  banReason: string | null;
  bannedAt: string | null;
  createdAt: string;
  _count: { listings: number };
};

export function BansTab() {
  const { toast } = useToast();
  const [users, setUsers] = useState<BannedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [banUserId, setBanUserId] = useState("");
  const [banReason, setBanReason] = useState("");

  const fetchBans = async () => {
    try {
      const res = await fetch("/api/admin/bans");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBans();
  }, []);

  const handleBan = async () => {
    if (!banUserId.trim()) {
      toast({ title: "أدخل ID المستخدم", variant: "destructive" });
      return;
    }
    const res = await fetch("/api/admin/bans", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: banUserId.trim(),
        action: "ban",
        reason: banReason || "مخالفة قوانين الموقع",
      }),
    });
    if (res.ok) {
      toast({ title: "تم حظر المستخدم ✓", duration: 1500 });
      setBanUserId("");
      setBanReason("");
      fetchBans();
    } else {
      const err = await res.json();
      toast({ title: "خطأ", description: err.error, variant: "destructive" });
    }
  };

  const handleUnban = async (userId: string, username: string) => {
    if (!confirm(`هل تريد إلغاء حظر "${username}"؟`)) return;
    const res = await fetch("/api/admin/bans", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: "unban" }),
    });
    if (res.ok) {
      toast({ title: "تم إلغاء الحظر ✓", duration: 1500 });
      fetchBans();
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-20 bg-muted animate-pulse rounded-lg" />
        <div className="h-48 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-cairo font-bold text-lg flex items-center gap-2">
        <Ban className="h-5 w-5 text-destructive" />
        إدارة الحظر ({users.length})
      </h3>

      {/* Ban a user manually */}
      <Card className="p-3 space-y-2">
        <h4 className="font-cairo font-bold text-sm">حظر مستخدم يدوياً</h4>
        <div>
          <Label className="mb-1 block text-xs">ID المستخدم</Label>
          <input
            type="text"
            value={banUserId}
            onChange={(e) => setBanUserId(e.target.value)}
            placeholder="cmr..."
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm font-mono"
            dir="ltr"
          />
        </div>
        <div>
          <Label className="mb-1 block text-xs">سبب الحظر</Label>
          <Textarea
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            placeholder="مثال: نشر إعلانات مخالفة، احتيال، إلخ"
            rows={2}
            className="text-sm"
          />
        </div>
        <Button onClick={handleBan} variant="destructive" size="sm" className="w-full">
          <Ban className="h-4 w-4 ml-1" />
          حظر المستخدم
        </Button>
      </Card>

      {/* Banned users list */}
      <div className="space-y-2 max-h-[55vh] overflow-y-auto">
        {users.length === 0 ? (
          <Card className="p-8 text-center">
            <Check className="h-12 w-12 mx-auto text-green-500 mb-2" />
            <p className="text-muted-foreground">لا يوجد مستخدمون محظورون</p>
            <p className="text-xs text-muted-foreground mt-1">المستخدمون المحظورون سيظهرون هنا</p>
          </Card>
        ) : (
          users.map((u) => (
            <Card key={u.id} className="p-3">
              <div className="flex items-start gap-3">
                <div className="bg-red-100 text-red-700 rounded-lg p-2 shrink-0">
                  <Ban className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-cairo font-bold">{u.username}</span>
                    <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs">
                      محظور
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span dir="ltr">{u.email}</span>
                    {u.phone && <span dir="ltr">{u.phone}</span>}
                    {u.city && <span>{u.city}</span>}
                    <span>{u._count.listings} إعلان</span>
                  </div>
                  {u.banReason && (
                    <div className="text-xs mt-1 bg-amber-50 border border-amber-200 rounded p-2 text-amber-800 flex items-start gap-1">
                      <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                      <span>سبب الحظر: {u.banReason}</span>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    حُظر في: {u.bannedAt ? formatArabicDate(new Date(u.bannedAt)) : "غير معروف"}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs text-green-700 border-green-300 hover:bg-green-50 shrink-0"
                  onClick={() => handleUnban(u.id, u.username)}
                >
                  <Check className="h-3 w-3 ml-1" />
                  إلغاء الحظر
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
