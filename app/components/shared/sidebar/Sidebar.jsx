"use client";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarFooter,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { sidebarItems } from "./SidebarItems";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Assets } from "../../../../assets/assets";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { EllipsisVertical, PanelRightOpen, PanelLeftOpen, UserPen, LogOut, Settings, MessageCircleQuestionMark, Camera, User as UserIcon, AtSign, FileText, Save, X } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import SettingsModal from "./SettingsModal";
import ProfileModal from "./ProfileModal";
import HelpFeedbackModal from "./HelpFeedbackModal";

export default function AppSidebar() {
  const pathname = usePathname();
  const { toggleSidebar, state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';
  const router = useRouter();

  const [openLogoutDialog, setOpenLogoutDialog] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [openSettingsModal, setOpenSettingsModal] = useState(false);

  // Profile modal states
  const [openProfileModal, setOpenProfileModal] = useState(false);
  const [openHelpModal, setOpenHelpModal] = useState(false);

  // ✅ ADD USER STATE
  const [user, setUser] = useState({
    name: "Guest User",
    email: "guest@example.com",
    picture: null,
  });

  // Only render theme-dependent content after mounting
  useEffect(() => {
    setMounted(true);

    // ✅ FETCH USER DATA FROM LOCALSTORAGE
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser({
          name: userData.name || "Guest User",
          email: userData.email || "guest@example.com",
          picture: userData.picture || null,
        });
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  const isDarkMode = resolvedTheme === "dark";

  // Glassmorphism styles matching the header
  const glassStyle = {
    backgroundColor: isLight ? 'rgba(235, 230, 255, 1)' : 'rgba(10, 8, 16, 0.1)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  };

  // ✅ GET INITIALS FOR AVATAR FALLBACK
  const getInitials = (name) => {
    if (!name) return "GU";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  function handleLogout() {
    setIsLoggingOut(true);

    // Clear authentication data directly
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Show success message
    toast.success('Logged out successfully');

    // Instant hard redirect
    setIsLoggingOut(false);
    setOpenLogoutDialog(false);
    window.location.href = '/';
  }

  if (!mounted) return null;

  return (
    <Sidebar
      data-sidebar="sidebar"
      className="h-screen"
      collapsible="icon"
      style={{
        ...glassStyle,
        borderRight: isLight ? '1px solid rgba(101, 90, 124, 0.12)' : '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      {/* HEADER */}
      <SidebarHeader
        className="h-20 py-4 group/header"
        style={{
          borderBottom: isLight ? '1px solid rgba(101, 90, 124, 0.12)' : '1px solid rgba(255, 255, 255, 0.06)',
          background: 'transparent',
        }}
      >
        <div className="h-full flex items-center justify-between px-2 group-data-[collapsible=icon]:px-0 relative">
          {/* Logo + text - hides on hover ONLY when collapsed */}
          <div className="flex items-center gap-2 overflow-hidden transition-opacity duration-300 group-data-[collapsible=icon]:group-hover/header:opacity-0 group-data-[collapsible=icon]:mx-auto">
            {/* Logo icon - suppress hydration warning for theme-dependent rendering */}
            <div className="w-10 h-10 rounded-xl dark:bg-background flex items-center justify-center border border-primary shrink-0 group/logo" suppressHydrationWarning>
              {mounted ? (
                <Image
                  src={isDarkMode ? Assets.logo_dark : Assets.logo_light}
                  className="w-7.5 h-8"
                  alt="PersonaAI Logo"
                />
              ) : (
                <Image
                  src={Assets.logo_light}
                  className="w-7.5 h-8"
                  alt="PersonaAI Logo"
                />
              )}
            </div>

            {/* Brand text – hide when collapsed */}
            <span className={cn(
              "text-xl font-semibold tracking-tight whitespace-nowrap group-data-[collapsible=icon]:hidden",
              isLight ? "text-foreground" : "text-white"
            )}>
              Persona
              <span className="font-bold text-sidebar-primary">AI</span>
            </span>
          </div>

          {/* Toggle button - shows on hover when collapsed, or always when expanded */}
          <button
            onClick={toggleSidebar}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/20 dark:hover:bg-white/10 shrink-0 cursor-pointer transition-all duration-300",
              isLight ? "text-foreground" : "text-white",
              "group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:left-1/2 group-data-[collapsible=icon]:-translate-x-1/2 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:group-hover/header:opacity-100"
            )}
            aria-label="Toggle sidebar"
          >
            {/* expanded icon */}
            <PanelRightOpen className="w-5 h-5 group-data-[collapsible=icon]:hidden" />
            {/* collapsed icon */}
            <PanelLeftOpen className="w-5 h-5 hidden group-data-[collapsible=icon]:inline-block" />
          </button>
        </div>
      </SidebarHeader>

      {/* NAV */}
      <SidebarContent className="py-1 px-1" style={{ background: 'transparent' }}>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {sidebarItems.map((item) => {
                // Match exact route, OR if it's a nested route under a module (skip this for the root /dashboard)
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(`${item.href}/`));
                return (
                  <SidebarMenuItem
                    key={item.href}
                    className="h-9 group-data-[collapsible=icon]:h-8"
                  >
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={cn(
                        "gap-3 relative rounded-lg transition-colors h-10 w-full flex items-center shadow-none",
                        isActive
                          ? "bg-secondary hover:bg-secondary/90 text-white font-semibold"
                          : "font-medium hover:bg-primary/10 hover:text-primary dark:hover:bg-white/5 dark:hover:text-persona-cream text-muted-foreground dark:text-white/80"
                      )}
                    >
                      <Link
                        href={item.href}
                        className="flex w-fit items-center px-2"
                      >
                        <span className={cn(isCollapsed ? "-ml-1 scale-80" : "ml-0 scale-80")}>
                          {item.icon}
                        </span>
                        <span className={`text-[15px] font-medium truncate ${isActive ? "font-semibold" : "font-normal"} ${isCollapsed ? "hidden" : ""}`}>
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* FOOTER */}
      <SidebarFooter
        className="group/footer"
        style={{
          borderTop: isLight ? '1px solid rgba(101, 90, 124, 0.12)' : '1px solid rgba(255, 255, 255, 0.08)',
          background: 'transparent',
        }}
      >
        <SidebarMenu className="group-data-[collapsible=icon]:ml-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className={cn(
                "flex items-center h-auto rounded-lg transition-colors group-data-[collapsible=icon]:justify-center",
                "hover:bg-primary/10 dark:hover:bg-white/10 active:bg-primary/15 dark:active:bg-white/15",
                isLight ? "text-foreground" : "text-white/80"
              )}
            >
              <div className="relative flex items-center w-full rounded-lg cursor-pointer group-data-[collapsible=icon]:justify-center">

                {/* LEFT: Avatar + text */}
                <div className="flex items-center gap-3 flex-1 min-w-0 group-data-[collapsible=icon]:hidden">

                  {/* Avatar (strict size, never shrink) */}
                  <div className="relative w-8 h-8 shrink-0">
                    <Avatar className="w-8 h-8 rounded-lg">
                      <AvatarImage
                        src={user.picture || "https://github.com/shadcn.png"}
                        alt={user.name}
                      />
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>

                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-persona-dark" />
                  </div>

                  {/* Text block (flexible, truncates) */}
                  <div className="flex flex-col flex-1 min-w-0 text-left">
                    <span
                      className={cn("text-sm font-semibold truncate", isLight ? "text-foreground" : "text-white")}
                      title={user.name}
                    >
                      {user.name}
                    </span>

                    <span
                      className={cn("text-xs truncate", isLight ? "text-muted-foreground" : "text-white/60")}
                      title={user.email}
                    >
                      {user.email}
                    </span>
                  </div>
                </div>

                {/* RIGHT: Menu button (fixed) */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      aria-label="User options"
                      className={cn(
                        "w-9 h-9 shrink-0 rounded-lg flex items-center justify-center transition-colors",
                        "hover:bg-primary/10 dark:hover:bg-white/10 active:bg-primary/20 dark:active:bg-white/15",
                        isLight ? "text-foreground" : "text-white/70"
                      )}
                    >
                      <EllipsisVertical className="w-5 h-5" />
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    className="w-56 border dark:border-white/10 dark:text-persona-cream shadow-xl backdrop-blur-[12px] bg-background/80"
                    side={isMobile ? "top" : "right"}
                    align={isMobile ? "center" : "end"}
                    sideOffset={isMobile ? 26 : (isCollapsed ? 23 : 29)}
                    alignOffset={isMobile ? 0 : (isCollapsed ? 0 : -12)}
                  >
                    <DropdownMenuLabel className="font-semibold text-foreground dark:text-persona-cream/90">
                      My Account
                    </DropdownMenuLabel>

                    <DropdownMenuGroup>
                      <DropdownMenuItem onClick={() => setOpenProfileModal(true)} className="text-foreground dark:text-persona-cream/80 hover:bg-primary/10 dark:hover:bg-white/10 cursor-pointer focus:bg-primary/10 dark:focus:bg-white/10 transition-colors">
                        <UserPen className="size-4" /> Profile
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => setOpenSettingsModal(true)}
                        className="text-foreground dark:text-persona-cream/80 hover:bg-primary/10 dark:hover:bg-white/10 cursor-pointer focus:bg-primary/10 dark:focus:bg-white/10 transition-colors"
                      >
                        <Settings className="size-4" /> Settings
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => setOpenHelpModal(true)}
                        className="text-foreground dark:text-persona-cream/80 hover:bg-primary/10 dark:hover:bg-white/10 cursor-pointer focus:bg-primary/10 dark:focus:bg-white/10 transition-colors"
                      >
                        <MessageCircleQuestionMark className="size-4" />
                        Help & Support
                      </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator className="dark:bg-black/10" />

                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setOpenLogoutDialog(true)}
                      className={cn(
                        "cursor-pointer",
                        "dark:text-persona-cream/80 dark:hover:bg-white/10 dark:hover:text-persona-cream",
                        "hover:text-persona-cream hover:bg-red"
                      )}
                    >
                      <LogOut className="text-red" /> Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Logout dialog */}
                <AlertDialog open={openLogoutDialog} onOpenChange={setOpenLogoutDialog}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Log out of PersonaAI?</AlertDialogTitle>
                      <AlertDialogDescription>
                        You can log back in anytime to continue your journey.
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                      <AlertDialogCancel className="cursor-pointer hover:bg-persona-indigo hover:text-black">
                        Cancel
                      </AlertDialogCancel>

                      <AlertDialogAction
                        onClick={handleLogout}
                        className="bg-red-500 hover:bg-red-700 text-white cursor-pointer"
                      >
                        <LogOut />
                        {isLoggingOut ? "Logging out..." : "Log out"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* ─── PROFILE MODAL ─── */}
      <ProfileModal
        isOpen={openProfileModal}
        onClose={() => setOpenProfileModal(false)}
        onProfileUpdate={(updatedUser) => {
          setUser({
            name: updatedUser.name,
            email: updatedUser.email || user.email,
            picture: updatedUser.picture || null,
          });
        }}
      />

      {/* ─── SETTINGS MODAL ─── */}
      <SettingsModal isOpen={openSettingsModal} onClose={() => setOpenSettingsModal(false)} />

      {/* ─── HELP MODAL ─── */}
      <HelpFeedbackModal isOpen={openHelpModal} onClose={() => setOpenHelpModal(false)} />

    </Sidebar>
  );
}