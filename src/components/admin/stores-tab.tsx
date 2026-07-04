"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Store,
  Check,
  X,
  Trash2,
  Award,
  Crown,
  Star,
} from "lucide-react";
import { formatArabicDate } from "@/lib/format";

type StoreData = {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  phone: string;
  email: string | null;
  city: string;
  isVerified: boolean;
  verifiedAt: string | null;
  licenseNumber: string | null;
  subscriptionType: string;
  subscriptionStart: string | null;
  subscriptionEnd: string | null;
  totalSales: number;
  totalRevenue: number;
  rating: number;
  isActive: boolean;
  createdAt: string;
  user: { id: string; username: string; email: string; phone: string };
};

const SUBSCRIPTION_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  free: { label: "مجاني", color: "bg-gray-100 text-gray-700", icon: <Store className="h-3 w-3" /> },
  basic: { label: "أساسي", color: "bg-blue-100 text-blue-700", icon: <Star className="h-3 w-3" /> },
  premium: { label: "بريميوم", color: "bg-purple-100 text-purple-700", icon: <Award className="h-3 w-3" /> },
  vip: { label: "VIP", color: "bg-amber-100 text-amber-700", icon: <Crown className="h-3 w-3" /> },
};

export function StoresTab() {
  const { toast } = useToast();
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStores = async () => {
    try {
      const res = await fetch("/api/admin/stores");
      if (res.ok) {
        const data = await res.json();
        setStores(data.stores);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleAction = async (id: string, action: string, data?: Record<string, unknown>) => {
    const res = await fetch("/api/admin/stores", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, data }),
    });
    if (res.ok) {
      toast({ title: "تم تنفيذ الإجراء ✓", duration: 1500 });
      fetchStores();
    } else {
      const err = await res.json();
      toast({ title: "خطأ", description: err.error, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف متجر "${name}"؟`)) return;
    await fetch(`/api/admin/stores/${id}`, { method: "DELETE" });
    toast({ title: "تم حذف المتجر", duration: 1500 });
    fetchStores();
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-20 bg-muted animate-pulse rounded-lg" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-cairo font-bold text-lg flex items-center gap-2">
        <Store className="h-5 w-5 text-primary" />
        إدارة المتاجر ({stores.length})
      </h3>

      <div className="space-y-2 max-h-[65vh] overflow-y-auto">
        {stores.length === 0 ? (
          <Card className="p-8 text-center">
            <Store className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">لا توجد متاجر بعد</p>
            <p className="text-xs text-muted-foreground mt-1">المتاجر تُنشأ عندما يسجّل المستخدمون متجراً</p>
          </Card>
        ) : (
          stores.map((s) => {
            const sub = SUBSCRIPTION_LABELS[s.subscriptionType] || SUBSCRIPTION_LABELS.free;
            return (
              <Card key={s.id} className="p-3">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 text-primary rounded-lg p-2 shrink-0">
                    <Store className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-cairo font-bold">{s.name}</span>
                      {s.isVerified && (
                        <Badge className="bg-primary/10 text-primary text-xs">
                          <Check className="h-3 w-3 ml-1" />
                          موثّق
                        </Badge>
                      )}
                      {!s.isActive && (
                        <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs">
                          متوقف
                        </Badge>
                      )}
                      <Badge variant="secondary" className={`${sub.color} text-xs`}>
                        {sub.icon}
                        <span className="ml-1">{sub.label}</span>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>المالك: {s.user.username}</span>
                      <span dir="ltr">{s.phone}</span>
                      <span>{s.city}</span>
                    </div>
                    {s.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description}</p>
                    )}
                    {s.licenseNumber && (
                      <div className="text-xs text-muted-foreground mt-1">
                        رخصة: {s.licenseNumber}
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-xs mt-1">
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {s.rating.toFixed(1)}
                      </span>
                      <span className="text-muted-foreground">{s.totalSales} مبيعة</span>
                      <span className="text-muted-foreground">{formatArabicDate(new Date(s.createdAt))}</span>
                      {s.subscriptionEnd && (
                        <span className="text-muted-foreground">
                          اشتراك حتى {new Date(s.subscriptionEnd).toLocaleDateString("ar-SA")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    {!s.isVerified ? (
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleAction(s.id, "verify")}
                      >
                        <Check className="h-3 w-3 ml-1" />
                        توثيق
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => handleAction(s.id, "unverify")}
                      >
                        إلغاء التوثيق
                      </Button>
                    )}
                    <select
                      value={s.subscriptionType}
                      onChange={(e) => handleAction(s.id, "subscribe", { type: e.target.value })}
                      className="h-7 text-xs px-2 rounded border border-input bg-background"
                    >
                      <option value="free">مجاني</option>
                      <option value="basic">أساسي</option>
                      <option value="premium">بريميوم</option>
                      <option value="vip">VIP</option>
                    </select>
                    {s.isActive ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => handleAction(s.id, "deactivate")}
                      >
                        إيقاف
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => handleAction(s.id, "activate")}
                      >
                        تفعيل
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-destructive hover:text-destructive"
                      onClick={() => handleDelete(s.id, s.name)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
