"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Package, Eye, Star, Shield, Search, Ban, CheckCircle, TrendingUp, BarChart3 } from "lucide-react";

type Stats = { totalUsers: number; totalListings: number; activeListings: number; totalCategories: number; featuredListings: number; totalViews: number; };
type User = { id: string; username: string; email: string; phone: string; city: string; isVerified: boolean; isAdmin: boolean; rating: number; createdAt: string; };

export default function AdminDashboard({ onClose }: { onClose?: () => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats").then(r => r.json()).then(d => !d.error && setStats(d)).catch(() => {});
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    fetch(`/api/admin/users-list?search=${encodeURIComponent(search)}`)
      .then(r => r.json())
      .then(d => setUsers(d.users || []))
      .catch(() => {});
  };

  const toggleBlock = async (userId: string, block: boolean) => {
    await fetch("/api/admin/block", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, blocked: block }) });
    fetchUsers();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full p-6 my-8" dir="rtl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">لوحة تحكم الإدارة</h2>
          {onClose && <Button variant="ghost" onClick={onClose}>إغلاق</Button>}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          <StatCard icon={Users} label="المستخدمون" value={stats?.totalUsers ?? 0} color="text-blue-600" />
          <StatCard icon={Package} label="الإعلانات" value={stats?.totalListings ?? 0} color="text-green-600" />
          <StatCard icon={TrendingUp} label="النشطة" value={stats?.activeListings ?? 0} color="text-emerald-600" />
          <StatCard icon={Star} label="المميزة" value={stats?.featuredListings ?? 0} color="text-amber-600" />
          <StatCard icon={Eye} label="المشاهدات" value={stats?.totalViews ?? 0} color="text-purple-600" />
          <StatCard icon={BarChart3} label="الأقسام" value={stats?.totalCategories ?? 0} color="text-rose-600" />
        </div>

        <Tabs defaultValue="users">
          <TabsList className="mb-4">
            <TabsTrigger value="users">المستخدمون</TabsTrigger>
            <TabsTrigger value="listings">الإعلانات</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <div className="flex gap-2 mb-4">
              <Input placeholder="بحث بالاسم أو البريد..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1" onKeyDown={e => e.key === "Enter" && fetchUsers()} />
              <Button onClick={fetchUsers}><Search className="h-4 w-4 ml-1" />بحث</Button>
            </div>
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
          </TabsContent>

          <TabsContent value="listings">
            <ListingAdmin />
          </TabsContent>
        </Tabs>
      </div>
    </div>
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

function ListingAdmin() {
  const [listings, setListings] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/admin/listings").then(r => r.json()).then(d => setListings(d.listings || [])).catch(() => {});
  }, []);

  return (
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
  );
}
