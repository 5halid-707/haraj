"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Lock,
  AlertTriangle,
  Check,
  X,
} from "lucide-react";
import { formatArabicDate } from "@/lib/format";

type TrustedPurchase = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  trackingNumber: string | null;
  shippingCompany: string | null;
  buyerNote: string | null;
  sellerNote: string | null;
  adminNote: string | null;
  disputeReason: string | null;
  disputeResolution: string | null;
  createdAt: string;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  completedAt: string | null;
  listing: { id: string; title: string; price: number };
  buyer: { id: string; username: string; email: string; phone: string };
  seller: { id: string; username: string; email: string; phone: string };
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "بانتظار الدفع", color: "bg-amber-100 text-amber-700" },
  paid: { label: "مدفوع", color: "bg-blue-100 text-blue-700" },
  shipped: { label: "تم الشحن", color: "bg-purple-100 text-purple-700" },
  delivered: { label: "تم التسليم", color: "bg-cyan-100 text-cyan-700" },
  completed: { label: "مكتمل", color: "bg-green-100 text-green-700" },
  cancelled: { label: "ملغي", color: "bg-gray-100 text-gray-700" },
  disputed: { label: "نزاع", color: "bg-red-100 text-red-700" },
};

export function TrustedPurchasesTab() {
  const { toast } = useToast();
  const [purchases, setPurchases] = useState<TrustedPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolution, setResolution] = useState<{ [key: string]: string }>({});

  const fetchPurchases = async () => {
    try {
      const res = await fetch("/api/admin/trusted-purchases");
      if (res.ok) {
        const data = await res.json();
        setPurchases(data.purchases);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const handleResolve = async (id: string, action: "refund_buyer" | "pay_seller") => {
    const resText = resolution[id];
    if (!resText?.trim()) {
      toast({ title: "أدخل قرار الحل", variant: "destructive" });
      return;
    }
    if (!confirm(`هل تريد ${action === "refund_buyer" ? "استرداد المبلغ للمشتري" : "دفع المبلغ للبائع"}؟`)) return;

    const res = await fetch(`/api/admin/trusted-purchases/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolution: resText, action }),
    });
    if (res.ok) {
      toast({ title: "تم حل النزاع ✓", duration: 1500 });
      setResolution({ ...resolution, [id]: "" });
      fetchPurchases();
    }
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
        <Lock className="h-5 w-5 text-primary" />
        عمليات الشراء الموثوق ({purchases.length})
      </h3>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        <p className="font-cairo font-bold mb-1">كيف يعمل الشراء الموثوق؟</p>
        <p className="text-xs">المشتري يدفع المبلغ → يُحجز في الموقع → البائع يشحن → المشتري يؤكد الاستلام → يُحوّل المبلغ للبائع. في حالة نزاع، الأدمن يحل المشكلة.</p>
      </div>

      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {purchases.length === 0 ? (
          <Card className="p-8 text-center">
            <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">لا توجد عمليات شراء موثوق بعد</p>
          </Card>
        ) : (
          purchases.map((p) => {
            const status = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending;
            return (
              <Card key={p.id} className="p-3">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 text-primary rounded-lg p-2 shrink-0">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-cairo font-bold text-sm">{p.listing.title}</span>
                      <Badge variant="secondary" className={`${status.color} text-xs`}>
                        {status.label}
                      </Badge>
                    </div>
                    <div className="text-primary font-cairo font-bold text-sm mt-1">
                      {p.amount} {p.currency}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                      <div className="bg-muted/30 rounded p-2">
                        <div className="text-muted-foreground">المشتري</div>
                        <div className="font-cairo font-bold">{p.buyer.username}</div>
                        <div dir="ltr" className="text-muted-foreground">{p.buyer.phone}</div>
                      </div>
                      <div className="bg-muted/30 rounded p-2">
                        <div className="text-muted-foreground">البائع</div>
                        <div className="font-cairo font-bold">{p.seller.username}</div>
                        <div dir="ltr" className="text-muted-foreground">{p.seller.phone}</div>
                      </div>
                    </div>
                    {p.trackingNumber && (
                      <div className="text-xs mt-1" dir="ltr">
                        رقم التتبع: {p.shippingCompany} - {p.trackingNumber}
                      </div>
                    )}
                    {p.buyerNote && (
                      <div className="text-xs mt-1 text-muted-foreground">ملاحظة المشتري: {p.buyerNote}</div>
                    )}
                    {p.sellerNote && (
                      <div className="text-xs mt-1 text-muted-foreground">ملاحظة البائع: {p.sellerNote}</div>
                    )}
                    {p.disputeReason && (
                      <div className="text-xs mt-1 bg-red-50 border border-red-200 rounded p-2 text-red-700">
                        <AlertTriangle className="h-3 w-3 inline ml-1" />
                        سبب النزاع: {p.disputeReason}
                      </div>
                    )}
                    {p.disputeResolution && (
                      <div className="text-xs mt-1 bg-green-50 border border-green-200 rounded p-2 text-green-700">
                        <Check className="h-3 w-3 inline ml-1" />
                        الحل: {p.disputeResolution}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      تاريخ الطلب: {formatArabicDate(new Date(p.createdAt))}
                    </div>

                    {/* Dispute resolution form */}
                    {p.status === "disputed" && !p.disputeResolution && (
                      <div className="mt-2 pt-2 border-t space-y-2">
                        <Label className="text-xs block">قرار حل النزاع *</Label>
                        <Textarea
                          value={resolution[p.id] || ""}
                          onChange={(e) => setResolution({ ...resolution, [p.id]: e.target.value })}
                          placeholder="اكتب قرارك وسبب الحل..."
                          rows={2}
                          className="text-xs"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs flex-1 border-blue-300 text-blue-700"
                            onClick={() => handleResolve(p.id, "refund_buyer")}
                          >
                            <X className="h-3 w-3 ml-1" />
                            استرداد للمشتري
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs flex-1 border-green-300 text-green-700"
                            onClick={() => handleResolve(p.id, "pay_seller")}
                          >
                            <Check className="h-3 w-3 ml-1" />
                            دفع للبائع
                          </Button>
                        </div>
                      </div>
                    )}
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
