import { useNavigate } from "react-router-dom";
import { useIsFetching } from "@tanstack/react-query";
import { Search, Bell, Menu, ChevronDown, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardHeaderProps {
  onMenuClick: () => void;
}

export default function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const navigate = useNavigate();
  const fetching = useIsFetching({ stale: false }) > 0;

  return (
    <header className="sticky top-0 z-30 h-16 bg-surface border-b border-border flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
          <Menu className="w-5 h-5" />
        </Button>
        {fetching ? (
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground" role="status" aria-live="polite">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />
            <span>Loading data…</span>
          </div>
        ) : null}
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products, orders, customers..."
            className="pl-9 w-64 lg:w-80 bg-muted border-0 focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-3">
              <div className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center text-primary-foreground text-sm font-semibold">
                A
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium leading-none">Admin</p>
                <p className="text-xs text-muted-foreground">Super Admin</p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground hidden md:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => navigate("/dashboard/profile")}>Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>Account Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => {
                localStorage.removeItem("admin_access_token");
                navigate("/login", { replace: true });
              }}
            >
              Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
