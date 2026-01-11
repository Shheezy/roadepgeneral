import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Users, TrendingUp, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MainLayout } from "@/components/layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";

interface Stats {
  totalLeads: number;
  totalUsers: number;
  newLeadsToday: number;
  pendingLeads: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalLeads: 0,
    totalUsers: 0,
    newLeadsToday: 0,
    pendingLeads: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [leadsRes, usersRes, newLeadsRes, pendingRes] = await Promise.all([
      supabase.from("leads").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", today.toISOString()),
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "new"),
    ]);

    setStats({
      totalLeads: leadsRes.count || 0,
      totalUsers: usersRes.count || 0,
      newLeadsToday: newLeadsRes.count || 0,
      pendingLeads: pendingRes.count || 0,
    });
  };

  const statCards = [
    {
      title: "Összes Lead",
      value: stats.totalLeads,
      icon: MapPin,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Felhasználók",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Mai új Lead-ek",
      value: stats.newLeadsToday,
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Függőben",
      value: stats.pendingLeads,
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Üdvözöljük az admin felületen
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="shadow-card hover:shadow-elevated transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Gyors műveletek</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <a
                  href="/admin/leads"
                  className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <MapPin className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">Lead-ek kezelése</p>
                    <p className="text-sm text-muted-foreground">Új lead hozzáadása, szerkesztés</p>
                  </div>
                </a>
                <a
                  href="/admin/users"
                  className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <Users className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="font-medium">Felhasználók</p>
                    <p className="text-sm text-muted-foreground">Role-ok beállítása</p>
                  </div>
                </a>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </MainLayout>
  );
}
