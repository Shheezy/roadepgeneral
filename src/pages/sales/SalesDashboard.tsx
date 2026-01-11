import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MainLayout } from "@/components/layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

interface Stats {
  totalLeads: number;
  newLeads: number;
  contacted: number;
  completed: number;
}

export default function SalesDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalLeads: 0,
    newLeads: 0,
    contacted: 0,
    completed: 0,
  });
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    const { data, error } = await supabase
      .from("leads")
      .select("status");

    if (!error && data) {
      setStats({
        totalLeads: data.length,
        newLeads: data.filter((l) => l.status === "new").length,
        contacted: data.filter((l) => l.status === "contacted").length,
        completed: data.filter((l) => l.status === "completed").length,
      });
    }
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
      title: "Új Lead-ek",
      value: stats.newLeads,
      icon: Clock,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Kapcsolatfelvétel alatt",
      value: stats.contacted,
      icon: TrendingUp,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Befejezett",
      value: stats.completed,
      icon: CheckCircle2,
      color: "text-success",
      bgColor: "bg-success/10",
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-foreground">Üdvözöljük!</h1>
          <p className="text-muted-foreground mt-1">
            Itt láthatod az aktuális lead-jeidet
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
              <Link
                to="/sales/map"
                className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <MapPin className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">Térkép nézet</p>
                  <p className="text-sm text-muted-foreground">
                    Nézd meg a lead-eket térképen
                  </p>
                </div>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </MainLayout>
  );
}
