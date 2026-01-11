import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  MapPin, 
  Users, 
  UserPlus,
  LogOut,
  Settings,
  Menu,
  X
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick?: () => void;
}

function NavItem({ to, icon, label, isActive, onClick }: NavItemProps) {
  return (
    <Link to={to} onClick={onClick}>
      <motion.div
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
          isActive 
            ? "bg-sidebar-primary text-sidebar-primary-foreground" 
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        )}
      >
        {icon}
        <span className="font-medium">{label}</span>
      </motion.div>
    </Link>
  );
}

export function Sidebar() {
  const location = useLocation();
  const { isAdmin, isSalesRep, signOut, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  const adminNavItems = [
    { to: "/admin", icon: <LayoutDashboard className="h-5 w-5" />, label: "Dashboard" },
    { to: "/admin/leads", icon: <MapPin className="h-5 w-5" />, label: "Lead-ek" },
    { to: "/admin/users", icon: <Users className="h-5 w-5" />, label: "Felhasználók" },
  ];

  const salesNavItems = [
    { to: "/sales", icon: <LayoutDashboard className="h-5 w-5" />, label: "Áttekintés" },
    { to: "/sales/map", icon: <MapPin className="h-5 w-5" />, label: "Térkép" },
  ];

  const navItems = isAdmin ? adminNavItems : salesNavItems;

  const SidebarContent = () => (
    <div className="flex flex-col h-full gradient-sidebar">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-sidebar-foreground">
          CRM <span className="text-sidebar-primary">Pro</span>
        </h1>
        <p className="text-sm text-sidebar-foreground/60 mt-1">
          {isAdmin ? "Admin Panel" : "Szerződéskötő"}
        </p>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <NavItem
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={item.label}
            isActive={location.pathname === item.to}
            onClick={closeMobile}
          />
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-medium">
            {user?.email?.[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.email}
            </p>
            <p className="text-xs text-sidebar-foreground/60">
              {isAdmin ? "Admin" : "Szerződéskötő"}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={signOut}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Kijelentkezés
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Mobile sidebar */}
      <motion.aside
        initial={{ x: "-100%" }}
        animate={{ x: mobileOpen ? 0 : "-100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed inset-y-0 left-0 w-64 z-50 md:hidden bg-sidebar"
      >
        <SidebarContent />
      </motion.aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-sidebar">
        <SidebarContent />
      </aside>
    </>
  );
}
