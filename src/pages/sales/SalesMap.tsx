import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin, Phone, FileText, Navigation } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Lead {
  id: string;
  zip_code: string;
  city: string;
  address: string;
  name: string;
  phone: string | null;
  notes: string | null;
  status: string;
  latitude: number | null;
  longitude: number | null;
}

export default function SalesMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [mapboxToken, setMapboxToken] = useState("");
  const [isMapReady, setIsMapReady] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    fetchLeads();

    const channel = supabase
      .channel("leads-map")
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

  const initializeMap = () => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [19.0402, 47.4979], // Budapest
      zoom: 7,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.current.on("load", () => {
      setIsMapReady(true);
      addMarkers();
    });
  };

  const addMarkers = () => {
    if (!map.current) return;

    leads.forEach((lead) => {
      if (lead.latitude && lead.longitude) {
        const el = document.createElement("div");
        el.className = "marker";
        el.style.width = "30px";
        el.style.height = "30px";
        el.style.borderRadius = "50%";
        el.style.backgroundColor = lead.status === "new" ? "#3b82f6" : lead.status === "contacted" ? "#f59e0b" : "#22c55e";
        el.style.border = "3px solid white";
        el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
        el.style.cursor = "pointer";

        el.addEventListener("click", () => {
          setSelectedLead(lead);
        });

        new mapboxgl.Marker(el)
          .setLngLat([lead.longitude, lead.latitude])
          .addTo(map.current!);
      }
    });
  };

  useEffect(() => {
    if (mapboxToken && mapContainer.current) {
      initializeMap();
    }

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  useEffect(() => {
    if (isMapReady && leads.length > 0) {
      addMarkers();
    }
  }, [leads, isMapReady]);

  const statusColors: Record<string, string> = {
    new: "bg-blue-100 text-blue-800",
    contacted: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
  };

  const statusLabels: Record<string, string> = {
    new: "Új",
    contacted: "Kapcsolatfelvétel",
    completed: "Befejezett",
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-foreground">Térkép</h1>
          <p className="text-muted-foreground mt-1">
            Tekintsd meg a lead-eket térképen
          </p>
        </motion.div>

        {!mapboxToken ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-5 w-5" />
                  Mapbox beállítása
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  A térkép használatához add meg a Mapbox public token-edet.
                  Regisztrálj a{" "}
                  <a
                    href="https://mapbox.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    mapbox.com
                  </a>{" "}
                  oldalon és másold be a public token-t.
                </p>
                <div className="flex gap-3 max-w-lg">
                  <Input
                    placeholder="pk.eyJ1Ijoi..."
                    value={mapboxToken}
                    onChange={(e) => setMapboxToken(e.target.value)}
                  />
                  <Button onClick={initializeMap} className="gradient-primary">
                    Térkép betöltése
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Map */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2"
            >
              <Card className="shadow-card overflow-hidden">
                <div ref={mapContainer} className="h-[500px] w-full" />
              </Card>
            </motion.div>

            {/* Selected Lead Details */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              {selectedLead ? (
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{selectedLead.name}</span>
                      <Badge className={statusColors[selectedLead.status]}>
                        {statusLabels[selectedLead.status]}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">Cím</p>
                        <p className="text-muted-foreground">
                          {selectedLead.zip_code} {selectedLead.city},{" "}
                          {selectedLead.address}
                        </p>
                      </div>
                    </div>
                    {selectedLead.phone && (
                      <div className="flex items-start gap-3">
                        <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">Telefon</p>
                          <a
                            href={`tel:${selectedLead.phone}`}
                            className="text-primary hover:underline"
                          >
                            {selectedLead.phone}
                          </a>
                        </div>
                      </div>
                    )}
                    {selectedLead.notes && (
                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">Megjegyzés</p>
                          <p className="text-muted-foreground">
                            {selectedLead.notes}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-card">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Kattints egy pin-re a részletekért</p>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </div>
        )}

        {/* Leads List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Lead-ek listája</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leads.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    Nincsenek lead-ek
                  </p>
                ) : (
                  leads.map((lead) => (
                    <div
                      key={lead.id}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer ${
                        selectedLead?.id === lead.id
                          ? "bg-primary/5 border-primary"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedLead(lead)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{lead.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {lead.zip_code} {lead.city}, {lead.address}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {lead.phone && (
                          <a
                            href={`tel:${lead.phone}`}
                            className="text-primary hover:underline text-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {lead.phone}
                          </a>
                        )}
                        <Badge className={statusColors[lead.status]}>
                          {statusLabels[lead.status]}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </MainLayout>
  );
}
