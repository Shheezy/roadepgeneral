import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Shield, UserCheck } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string | null;
  created_at: string;
  role: "admin" | "sales_rep" | null;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesError) {
      toast.error("Hiba a felhasználók betöltésekor");
      setIsLoading(false);
      return;
    }

    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("*");

    if (rolesError) {
      toast.error("Hiba a szerepkörök betöltésekor");
      setIsLoading(false);
      return;
    }

    const usersWithRoles: UserWithRole[] = profiles.map((profile) => {
      const userRole = roles.find((r) => r.user_id === profile.user_id);
      return {
        ...profile,
        role: userRole?.role as "admin" | "sales_rep" | null,
      };
    });

    setUsers(usersWithRoles);
    setIsLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: "admin" | "sales_rep") => {
    // First check if user already has a role
    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (existingRole) {
      // Update existing role
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId);

      if (error) {
        toast.error("Hiba a szerepkör módosításakor");
        return;
      }
    } else {
      // Insert new role
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: newRole });

      if (error) {
        toast.error("Hiba a szerepkör hozzáadásakor");
        return;
      }
    }

    toast.success("Szerepkör sikeresen módosítva!");
    fetchUsers();
  };

  const roleLabels = {
    admin: { label: "Admin", color: "bg-primary text-primary-foreground" },
    sales_rep: { label: "Szerződéskötő", color: "bg-blue-500 text-white" },
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-foreground">Felhasználók</h1>
          <p className="text-muted-foreground mt-1">
            Kezeld a felhasználók szerepköreit
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Regisztrált felhasználók
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Felhasználó</TableHead>
                        <TableHead>Regisztráció</TableHead>
                        <TableHead>Jelenlegi szerepkör</TableHead>
                        <TableHead>Szerepkör beállítása</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            Nincsenek felhasználók
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-primary font-medium">
                                    {user.full_name?.[0]?.toUpperCase() || "?"}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium">{user.full_name || "Nincs név"}</p>
                                  <p className="text-sm text-muted-foreground">ID: {user.user_id.slice(0, 8)}...</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {new Date(user.created_at).toLocaleDateString("hu-HU")}
                            </TableCell>
                            <TableCell>
                              {user.role ? (
                                <Badge className={roleLabels[user.role].color}>
                                  {user.role === "admin" ? <Shield className="h-3 w-3 mr-1" /> : <UserCheck className="h-3 w-3 mr-1" />}
                                  {roleLabels[user.role].label}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground">
                                  Nincs szerepkör
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Select
                                value={user.role || ""}
                                onValueChange={(value) => handleRoleChange(user.user_id, value as "admin" | "sales_rep")}
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue placeholder="Válassz szerepkört" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="sales_rep">Szerződéskötő</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </MainLayout>
  );
}
