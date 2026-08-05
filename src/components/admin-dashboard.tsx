"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Package, Eye, Star, Search, Ban, CheckCircle, TrendingUp, BarChart3, X } from "lucide-react";

type Stats = { totalUsers: number; totalListings: number; activeListings: number; totalCategories: number; featuredListings: number; totalViews: number; };
type User = { id: string; username: string; email: string; phone: string; city: string; isVerified: boolean; isAdmin: boolean; rating: number; createdAt: string; };

export default function AdminDashboard({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    fetch("/api/admin/stats").then(r => r.json()).then(d => !d.error && setStats(d)).catch(() => {});
    fetchUsers();
    fetchListings();
  }, [open]);

  const fetchUsers = () => {
    fetch(`/api/admin/users-list?search=${encodeURIComponent(search)}`)
      .then(r => r.json()).then(d => setUsers(d.users || [])).catch(() => {});
  };

  const fetchListings = () => {
    fetch("/api/admin/listings").then(r => r.json()).then(d => setListings(d.listings || [])).catch(() => {});
  };

  const toggleBlock = async (userId: string, block: boolean) => {
    await fetch("/api/admin/block", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, blocked: block }) });
    fetchUsers();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">لوحة تحكم الإدارة</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[75vh] pr-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-4">
            <StatCard icon={Users} label="المستخدمون" value={stats?.totalUsers ?? 0} color="text-blue-600" />
            <StatCard icon={Package} label="الإعلانات" value={stats?.totalListings ?? 0} color="text-green-600" />
            <StatCard icon={TrendingUp} label="النشطة" value={stats?.activeListings ?? 0} color="text-emerald-600" />
            <StatCard icon={Star} label="المميزة" value={stats?.featuredListings ?? 0} color="text-amber-600" />
            <StatCard icon={Eye} label="المشاهدات" value={stats?.totalViews ?? 0} color="text-purple-600" />
            <StatCard icon={BarChart3} label="الأقسام" value={stats?.totalCategories ?? 0} color="text-rose-600" />
          </div>

          <Tabs defaultValue="users">
            <TabsList className="mb-3">
              <TabsTrigger value="users">المستخدمون ({users.length})</TabsTrigger>
              <TabsTrigger value="listings">الإعلانات ({listings.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <div className="flex gap-2 mb-3">
                <Input placeholder="بحث بالاسم أو البريد..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1" onKeyDown={e => e.key === "Enter" && fetchUsers()} />
                <Button size="sm" onClick={fetchUsers}><Search className="h-4 w-4 ml-1" />بحث</Button>
              </div>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>المستخدم</TableHead><TableHead>المدينة</TableHead>
                    <TableHead>التقييم</TableHead><TableHead>الحالة</TableHead><TableHead>إجراء</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">لا توجد بيانات</TableCell></TableRow>
                    ) : users.map(u => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="font-medium">{u.username}</div>
                          <div className="text-xs text-muted-foreground">{u.email}</div>
                        </TableCell>
                        <TableCell>{u.city || "—"}</TableCell>
                        <TableCell>⭐ {u.rating}</TableCell>
                        <TableCell>
                          {u.isAdmin ? <Badge>أدمن</Badge> : u.isVerified ? <Badge className="bg-green-100 text-green-700">موثق</Badge> : <Badge variant="secondary">محظور</Badge>}
                        </TableCell>
                        <TableCell>
                          {!u.isAdmin && (
                            <Button size="sm" variant={u.isVerified ? "destructive" : "default"} onClick={() => toggleBlock(u.id, u.isVerified)}>
                              {u.isVerified ? <><Ban className="h-3 w-3 ml-1" />حظر</> : <><CheckCircle className="h-3 w-3 ml-1" />تفعيل</>}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="listings">
              <div className="border rounded-lg">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>العنوان</TableHead><TableHead>السعر</TableHead>
                    <TableHead>المدينة</TableHead><TableHead>المشاهدات</TableHead><TableHead>الحالة</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {listings.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">لا توجد إعلانات</TableCell></TableRow>
                    ) : listings.map(l => (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium">{l.title}</TableCell>
                        <TableCell>{l.price?.toLocaleString()} {l.currency}</TableCell>
                        <TableCell>{l.city}</TableCell>
                        <TableCell>{l.views}</TableCell>
                        <TableCell>{l.status === "active" ? <Badge className="bg-green-100 text-green-700">نشط</Badge> : <Badge variant="secondary">متوقف</Badge>}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <Card><CardContent className="p-3 text-center">
      <Icon className={`h-5 w-5 mx-auto mb-1 ${color}`} />
      <div className="text-xl font-bold">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </CardContent></Card>
  );
}
