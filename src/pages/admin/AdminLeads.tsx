import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, MapPin, Phone, Edit2, Trash2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Lead {
  id: string;
  zip_code: string;
  city: string;
  address: string;
  name: string;
  phone: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}

const initialFormState = {
  zip_code: "",
  city: "",
  address: "",
  name: "",
  phone: "",
  notes: "",
};

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState(initialFormState);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchLeads();
    
    const channel = supabase
      .channel("leads-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads" },
        () => fetchLeads()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLeads = async () => {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setLeads(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingLead) {
        const { error } = await supabase
          .from("leads")
          .update({
            ...formData,
            phone: formData.phone || null,
            notes: formData.notes || null,
          })
          .eq("id", editingLead.id);

        if (error) throw error;
        toast.success("Lead sikeresen frissítve!");
      } else {
        const { error } = await supabase.from("leads").insert({
          ...formData,
          phone: formData.phone || null,
          notes: formData.notes || null,
          created_by: user?.id,
        });

        if (error) throw error;
        toast.success("Lead sikeresen hozzáadva!");
      }

      setIsDialogOpen(false);
      setEditingLead(null);
      setFormData(initialFormState);
    } catch (error: any) {
      toast.error("Hiba történt", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      zip_code: lead.zip_code,
      city: lead.city,
      address: lead.address,
      name: lead.name,
      phone: lead.phone || "",
      notes: lead.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Biztosan törölni szeretnéd ezt a lead-et?")) return;

    const { error } = await supabase.from("leads").delete().eq("id", id);

    if (error) {
      toast.error("Hiba történt a törlés során");
    } else {
      toast.success("Lead sikeresen törölve!");
    }
  };

  const filteredLeads = leads.filter(
    (lead) =>
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.city.toLowerCase().includes(search.toLowerCase()) ||
      lead.zip_code.includes(search)
  );

  const statusColors: Record<string, string> = {
    new: "bg-blue-100 text-blue-800",
    contacted: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground">Lead-ek</h1>
            <p className="text-muted-foreground mt-1">
              Kezeld az ügyfeleid adatait
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingLead(null);
              setFormData(initialFormState);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Új Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingLead ? "Lead szerkesztése" : "Új Lead hozzáadása"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zip_code">Irányítószám *</Label>
                    <Input
                      id="zip_code"
                      value={formData.zip_code}
                      onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                      required
                      placeholder="1234"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Város *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                      placeholder="Budapest"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Cím *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                    placeholder="Példa utca 1."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Név *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Kovács János"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefonszám</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+36 30 123 4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Megjegyzés</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="További információk..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                    Mégse
                  </Button>
                  <Button type="submit" className="flex-1 gradient-primary" disabled={isLoading}>
                    {isLoading ? "Mentés..." : editingLead ? "Mentés" : "Hozzáadás"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Keresés név, város vagy irányítószám alapján..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Név</TableHead>
                      <TableHead>Cím</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead>Státusz</TableHead>
                      <TableHead className="text-right">Műveletek</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Nincsenek lead-ek
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLeads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium">{lead.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{lead.zip_code} {lead.city}, {lead.address}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {lead.phone ? (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{lead.phone}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[lead.status] || statusColors.new}>
                              {lead.status === "new" ? "Új" : lead.status === "contacted" ? "Kapcsolatfelvétel" : "Befejezett"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(lead)}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(lead.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </MainLayout>
  );
}
