import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { 
  Terminal, 
  Sparkles, 
  HelpCircle, 
  ClipboardList, 
  TrendingDown, 
  User, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Progress } from "../ui/progress";
import { Button } from "../ui/button";

interface AppLayoutProps {
  children: React.ReactNode;
  profilePercentage: number;
  profileComplete: boolean;
}

export function AppLayout({ children, profilePercentage, profileComplete }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const navItems = [
    {
      label: "Analyse JD",
      path: "/analyse",
      icon: Terminal,
      primary: true,
    },
    {
      label: "Interview Prep",
      path: "/interview",
      icon: HelpCircle,
    },
    {
      label: "Application Tracker",
      path: "/tracker",
      icon: ClipboardList,
    },
    {
      label: "Rejection Analyser",
      path: "/rejections",
      icon: TrendingDown,
    },
    {
      label: "Profile",
      path: "/profile",
      icon: User,
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#0A0A0F] text-foreground">
      {/* Sidebar Navigation */}
      <aside
        className={cn(
          "relative flex flex-col border-r border-[#1F1F2E] bg-[#0E0E16] transition-all duration-300 z-30",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Toggle Collapse Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-8 flex h-6 w-6 items-center justify-center border border-[#1F1F2E] bg-[#0A0A0F] text-[#00FF88] hover:bg-[#151522] focus:outline-none"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        {/* Branding Logo Area */}
        <div className="flex h-20 items-center px-4 border-b border-[#1F1F2E]">
          <Link to="/analyse" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center bg-[#00FF88] text-[#0A0A0F] shadow-[0_0_10px_rgba(0,255,136,0.3)]">
              <Sparkles size={16} />
            </div>
            {!collapsed && (
              <span className="font-semibold tracking-wider text-xl text-[#00FF88] glow-text-green" style={{ fontFamily: 'Clash Display' }}>
                HIRE<span className="text-white">READY</span>
              </span>
            )}
          </Link>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 space-y-1.5 py-6 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 transition-all text-sm group relative",
                  isActive
                    ? item.primary
                      ? "bg-[#00FF88] text-[#0A0A0F] font-bold shadow-[0_0_15px_rgba(0,255,136,0.2)]"
                      : "bg-[#1A1A26] text-[#00FF88] border-l-2 border-[#00FF88] font-medium"
                    : "text-[#8E8E9E] hover:bg-[#12121D] hover:text-[#00FF88]"
                )}
              >
                <Icon
                  size={18}
                  className={cn(
                    "transition-transform group-hover:scale-110",
                    isActive && !item.primary && "text-[#00FF88]"
                  )}
                />
                {!collapsed && <span className="tracking-wide">{item.label}</span>}
                {isActive && collapsed && (
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#00FF88]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer (Profile Completeness & Logout) */}
        <div className="border-t border-[#1F1F2E] bg-[#0A0A0F] p-4 space-y-4">
          {!collapsed && (
            <div className="space-y-2 border border-[#1F1F2E] p-3 bg-[#0C0C14]">
              <div className="flex items-center justify-between text-[11px] code-font text-[#8E8E9E]">
                <span>PROFILE COMPLETENESS</span>
                <span className={cn(profileComplete ? "text-[#00FF88]" : "text-amber-500")}>
                  {profilePercentage}%
                </span>
              </div>
              <Progress value={profilePercentage} className="h-1.5 bg-[#1F1F2E]" indicatorClassName="bg-[#00FF88] shadow-[0_0_8px_rgba(0,255,136,0.3)]" />
              <div className="flex items-center gap-1.5 text-[10px] text-[#8E8E9E]">
                {profileComplete ? (
                  <>
                    <CheckCircle2 size={10} className="text-[#00FF88]" />
                    <span className="text-[#00FF88] font-medium">Ready for AI Analyse</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={10} className="text-amber-500" />
                    <span>Complete profile for best match</span>
                  </>
                )}
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            onClick={handleSignOut}
            className={cn(
              "w-full flex items-center hover:bg-[#2A1F1F] hover:text-red-400 text-[#8E8E9E] transition-all py-2.5 px-3 justify-start gap-3",
              collapsed && "justify-center px-0"
            )}
          >
            <LogOut size={18} />
            {!collapsed && <span className="tracking-wide">Sign Out</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Top Header Warning Banner if profile not complete */}
        {!profileComplete && location.pathname !== "/profile" && (
          <div className="flex items-center justify-between bg-amber-950/20 border-b border-amber-800/30 px-6 py-2.5 text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="text-amber-400" />
              <span>
                <strong>Profile incomplete ({profilePercentage}%)</strong>. Please configure your skills and projects to enable personalized, high-precision Job Fit analyses.
              </span>
            </div>
            <Link
              to="/profile"
              className="text-[#00FF88] font-bold hover:underline hover:text-[#00CC70] transition-colors"
            >
              Complete Now &rarr;
            </Link>
          </div>
        )}

        {/* Primary Page Content Wrapper */}
        <div className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
