import React, { useEffect, useState, Suspense } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User as UserEntity } from "@/api/entities";
import { SystemSettings } from "@/api/entities";
import { useAuth } from "@/contexts/AuthContext";
import {
  FileText,
  Home,
  ListChecks,
  Package,
  Truck,
  Shield,
  Database,
  Settings,
  FileCode,
  AlertTriangle,
  User,
  ChevronDown,
  Menu,
  X,
  Calculator,
  ClipboardCheck,
  Trash2,
  Zap,
  BarChart3,
  Beaker,
  ShoppingCart,
  Server,
  Wrench,
  ClipboardList,
  Activity,
  Users,
  PackageCheck,
  ArrowDownToLine,
  FileUp,
  FileStack,
  Bell,
  SlidersHorizontal,
  Building2,
  ArrowLeft,
  Upload,
  Clipboard,
  FlaskConical,
  TestTube,
  BadgeCheck,
  FileSearch,
  Archive,
  Target,
  TrendingUp,
  BookOpen,
  PhoneCall,
  UserPlus,
  ArrowRight,
  History,
  ScanLine,
  Hand,
  PackageMinus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { SystemLockProvider } from "@/components/ui/system-lock";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import SidebarNotifications from "@/components/ui/SidebarNotifications";

const SecurityMonitor = React.lazy(
  () => import("@/components/security/SecurityMonitor"),
);

export default function Layout({ children, currentPageName }) {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // All useState hooks first
  const [initialLoading, setInitialLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const storedCollapsed = localStorage.getItem("sidebarCollapsed");
      return storedCollapsed ? JSON.parse(storedCollapsed) : false;
    } catch (e) {
      return false;
    }
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [outStorageExpanded, setOutStorageExpanded] = useState(
    () => location.pathname === createPageUrl("InventoryRemoval"),
  );

  // State for open accordion groups, with localStorage integration
  const [openAccordionGroups, setOpenAccordionGroups] = useState(() => {
    try {
      const storedGroups = localStorage.getItem("openAccordionGroups");
      if (storedGroups) {
        return JSON.parse(storedGroups);
      }
    } catch (e) {}
    // Default open groups if nothing is stored
    return ["dashboard", "operations"];
  });

  const [systemDisplay, setSystemDisplay] = useState({
    mainHeaderName: "Flow Control",
    sidebarHeaderName: "Flow Control",
    logoUrl: "/logo-icon.png",
  });

  // Navigation history - improved implementation
  const [navigationHistory, setNavigationHistory] = useState(() => {
    try {
      const stored = sessionStorage.getItem("navigationHistory");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // All useEffect hooks after all useState hooks
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const settingsResult = await SystemSettings.list();

        if (settingsResult && settingsResult.length > 0) {
          setSystemDisplay({
            mainHeaderName: settingsResult[0].mainHeaderName || "Flow Control",
            sidebarHeaderName:
              settingsResult[0].sidebarHeaderName || "Flow Control",
            logoUrl: settingsResult[0].logoUrl || "/logo-icon.png",
          });
        }
      } catch (error) {
        console.error(
          "An unexpected error occurred during initial data fetch:",
          error,
        );
      } finally {
        setInitialLoading(false);
      }
    };
    fetchInitialData();
  }, [toast]);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Save sidebarCollapsed to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(
        "sidebarCollapsed",
        JSON.stringify(sidebarCollapsed),
      );
    } catch (e) {
      console.error("Failed to save sidebarCollapsed to localStorage", e);
    }
  }, [sidebarCollapsed]);

  // Save open groups to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(
        "openAccordionGroups",
        JSON.stringify(openAccordionGroups),
      );
    } catch (e) {
      console.error("Failed to save openAccordionGroups to localStorage", e);
    }
  }, [openAccordionGroups]);

  // Track navigation history - improved logic
  useEffect(() => {
    setNavigationHistory((prev) => {
      // Don't add if it's the same as the last entry
      if (prev.length > 0 && prev[prev.length - 1] === location.pathname) {
        return prev;
      }

      const newHistory = [...prev, location.pathname].slice(-20); // Keep last 20 entries

      // Save to sessionStorage
      try {
        sessionStorage.setItem("navigationHistory", JSON.stringify(newHistory));
      } catch (e) {
        console.error("Failed to save navigation history", e);
      }

      return newHistory;
    });
  }, [location.pathname]);

  // Navigation items - ordered by workflow frequency
  const navItems = [
    // Dashboard
    {
      name: "מרכז הבקרה",
      href: "Dashboard",
      icon: BarChart3,
      group: "dashboard",
    },
    // Daily operations
    {
      name: "קליטת משלוח",
      href: "NewDelivery",
      icon: ArrowDownToLine,
      group: "operations",
    },
    {
      name: "משלוחים שהתקבלו",
      href: "Deliveries",
      icon: FileStack,
      group: "operations",
    },
    {
      name: "ספירת מלאי",
      href: "InventoryCount",
      icon: Clipboard,
      group: "operations",
    },
    {
      name: "משיכת ריאגנטים",
      href: "NewWithdrawalRequest",
      icon: ArrowDownToLine,
      group: "operations",
    },
    {
      name: "ניהול בקשות משיכה",
      href: "WithdrawalRequests",
      icon: PackageCheck,
      group: "operations",
    },
    {
      name: "הוצאה מהמלאי",
      href: "DispenseItems",
      icon: ScanLine,
      group: "operations",
    },
    {
      name: "הוצאה מאוחדת",
      href: "InventoryRemoval",
      icon: PackageMinus,
      group: "operations",
    },
    {
      name: "פריטים בשימוש",
      href: "ItemsInUse",
      icon: Hand,
      group: "operations",
    },
    // Inventory management
    {
      name: "ניהול אצוות ופגי תוקף",
      href: "BatchAndExpiryManagement",
      icon: Archive,
      group: "inventory",
    },
    {
      name: "ניהול נתוני צריכה",
      href: "UsageDataManagement",
      icon: TrendingUp,
      group: "inventory",
    },
    {
      name: "חישוב השלמות מלאי",
      href: "InventoryReplenishment",
      icon: Target,
      group: "inventory",
    },
    // Procurement
    {
      name: "הקמת מסמך רכש חדש",
      href: "NewOrder",
      icon: FileText,
      group: "procurement",
    },
    {
      name: "ניהול דרישות רכש",
      href: "Orders",
      icon: ClipboardList,
      group: "procurement",
    },
    {
      name: "מעקב אספקות",
      href: "SupplyTracking",
      icon: FileSearch,
      group: "procurement",
    },
    // Outgoing shipments
    {
      name: "שליחת ריאגנטים",
      href: "NewShipment",
      icon: Truck,
      group: "shipments",
    },
    {
      name: "ניהול משלוחים יוצאים",
      href: "OutgoingShipments",
      icon: Package,
      group: "shipments",
    },
    // Quality
    {
      name: "בקרת איכות",
      href: "QualityAssurance",
      icon: FlaskConical,
      group: "quality",
    },
    {
      name: "העלאת תעודות אנליזה",
      href: "UploadCOA",
      icon: Upload,
      group: "quality",
    },
    // Reports & tracking
    { name: "דוחות ומעקב", href: "Reports", icon: BarChart3, group: "reports" },
    {
      name: "יומן פעילות",
      href: "ActivityLog",
      icon: Activity,
      group: "reports",
    },
    {
      name: "התראות ותזכורות",
      href: "AlertsManagement",
      icon: Bell,
      group: "reports",
    },
    {
      name: "הודעות",
      href: "Messages",
      icon: Bell,
      group: "reports",
    },
    {
      name: "הערות ומשימות",
      href: "DashboardNotes",
      icon: ClipboardCheck,
      group: "reports",
    },
    // Master data
    {
      name: "ניהול ריאגנטים",
      href: "ManageReagents",
      icon: FlaskConical,
      group: "master_data",
    },
    {
      name: "ניהול ספקים",
      href: "ManageSuppliers",
      icon: Building2,
      group: "master_data",
    },
    // Contacts
    {
      name: "ניהול אנשי קשר",
      href: "Contacts",
      icon: PhoneCall,
      group: "contacts",
    },
    {
      name: "קליטת אנשי קשר מקובץ",
      href: "ImportContacts",
      icon: UserPlus,
      group: "contacts",
    },
    // Documentation
    {
      name: "ניהול תיעוד מערכת",
      href: "SystemDocumentation",
      icon: BookOpen,
      group: "documentation",
    },
  ];

  const adminNavItems = [
    { name: "הגדרות מערכת", href: "SystemSettings", icon: Settings },
    { name: "ניהול מערכת", href: "SystemManagement", icon: Server },
    { name: "פאנל ניהול מתקדם", href: "AdminPanel", icon: Shield },
  ];

  // Filter function for search
  const filterNavItems = (items, searchTerm) => {
    if (!searchTerm.trim()) return items;

    return items.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  };

  // Apply search filter
  const filteredNavItems = filterNavItems(navItems, searchTerm);
  const filteredAdminNavItems = filterNavItems(adminNavItems, searchTerm);

  const groupedNavItems = filteredNavItems.reduce((groups, item) => {
    const group = item.group || "other";
    if (!groups[group]) groups[group] = [];
    groups[group].push(item);
    return groups;
  }, {});

  const groupHeadings = {
    dashboard: {
      title: "בית",
      emoji: "🏠",
      textColor: "text-slate-100",
      bgColor: "bg-slate-600/30",
      borderColor: "border-slate-400/50",
      iconColor: "text-slate-300",
    },
    operations: {
      title: "פעולות יומיות",
      emoji: "⚡",
      textColor: "text-blue-200",
      bgColor: "bg-blue-600/20",
      borderColor: "border-blue-400/50",
      iconColor: "text-blue-300",
    },
    inventory: {
      title: "ניהול מלאי",
      emoji: "📦",
      textColor: "text-teal-200",
      bgColor: "bg-teal-600/20",
      borderColor: "border-teal-400/50",
      iconColor: "text-teal-300",
    },
    procurement: {
      title: "רכש ודרישות",
      emoji: "🛒",
      textColor: "text-amber-200",
      bgColor: "bg-amber-600/20",
      borderColor: "border-amber-400/50",
      iconColor: "text-amber-300",
    },
    shipments: {
      title: "משלוחים יוצאים",
      emoji: "🚚",
      textColor: "text-sky-200",
      bgColor: "bg-sky-600/20",
      borderColor: "border-sky-400/50",
      iconColor: "text-sky-300",
    },
    quality: {
      title: "בקרת איכות",
      emoji: "🔬",
      textColor: "text-emerald-200",
      bgColor: "bg-emerald-600/20",
      borderColor: "border-emerald-400/50",
      iconColor: "text-emerald-300",
    },
    reports: {
      title: "דוחות ומעקב",
      emoji: "📊",
      textColor: "text-purple-200",
      bgColor: "bg-purple-600/20",
      borderColor: "border-purple-400/50",
      iconColor: "text-purple-300",
    },
    master_data: {
      title: "נתונים ראשיים",
      emoji: "⚙️",
      textColor: "text-slate-200",
      bgColor: "bg-slate-600/20",
      borderColor: "border-slate-400/50",
      iconColor: "text-slate-300",
    },
    contacts: {
      title: "אנשי קשר",
      emoji: "👥",
      textColor: "text-indigo-200",
      bgColor: "bg-indigo-600/20",
      borderColor: "border-indigo-400/50",
      iconColor: "text-indigo-300",
    },
    documentation: {
      title: "מסמכי מערכת",
      emoji: "📄",
      textColor: "text-gray-200",
      bgColor: "bg-gray-600/20",
      borderColor: "border-gray-400/50",
      iconColor: "text-gray-300",
    },
  };

  const isNavItemActive = (href) => location.pathname === createPageUrl(href);

  // Add currently active group to the open groups if it's not already there
  useEffect(() => {
    let activeGroup = null;
    const activeMainNavItem = navItems.find((item) =>
      isNavItemActive(item.href),
    );
    if (activeMainNavItem) {
      activeGroup = activeMainNavItem.group;
    } else if (user?.role === "admin") {
      const activeAdminNavItem = adminNavItems.find((item) =>
        isNavItemActive(item.href),
      );
      if (activeAdminNavItem) {
        activeGroup = "admin";
      }
    }

    if (activeGroup && !openAccordionGroups.includes(activeGroup)) {
      setOpenAccordionGroups((prev) => [...prev, activeGroup]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, user]);

  // Handle back navigation
  const handleBackClick = (e) => {
    e.preventDefault();

    // If we have history (more than current page), go back
    if (navigationHistory.length > 1) {
      // Remove current page and go to previous
      const newHistory = navigationHistory.slice(0, -1);
      const previousPath = newHistory[newHistory.length - 1];

      setNavigationHistory(newHistory);
      try {
        sessionStorage.setItem("navigationHistory", JSON.stringify(newHistory));
      } catch (e) {
        console.error("Failed to save navigation history", e);
      }

      navigate(previousPath);
    } else {
      // No history, go to dashboard
      navigate(createPageUrl("Dashboard"));
    }
  };

  const handleHistoryItemClick = (path) => {
    // Find the index of this path in history
    const index = navigationHistory.indexOf(path);
    if (index !== -1) {
      // Remove everything after this index
      const newHistory = navigationHistory.slice(0, index + 1);
      setNavigationHistory(newHistory);
      try {
        sessionStorage.setItem("navigationHistory", JSON.stringify(newHistory));
      } catch (e) {
        console.error("Failed to save navigation history", e);
      }
      navigate(path);
    }
  };

  // Check if back button should be disabled
  const canGoBack = navigationHistory.length > 1;

  // Get history for dropdown (excluding current page)
  const historyItems = navigationHistory.slice(0, -1).reverse().slice(0, 10);

  // Early return AFTER all hooks
  if (initialLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-800 text-white">
        טוען...
      </div>
    );
  }

  const sidebarContent = (
    <>
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4 mb-4">
          {!sidebarCollapsed && (
            <>
              <img
                src={systemDisplay.logoUrl}
                alt="לוגו"
                className="h-9 w-auto rounded-md object-contain"
                loading="lazy"
              />
              <h1 className="text-lg font-semibold text-white ms-3">
                {systemDisplay.sidebarHeaderName}
              </h1>
            </>
          )}
        </div>

        {/* Search Field */}
        {!sidebarCollapsed && (
          <div className="px-4 mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="חיפוש מסכים..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pe-3 ps-10 py-2 text-sm bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                dir="rtl"
              />
              <div className="absolute start-2 top-1/2 transform -translate-y-1/2">
                {searchTerm ? (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    aria-label="נקה חיפוש"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <svg
                    className="w-4 h-4 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                )}
              </div>
            </div>
            {searchTerm && (
              <p className="text-xs text-slate-400 mt-1.5 px-1">
                {filteredNavItems.length} תוצאות נמצאו
              </p>
            )}
          </div>
        )}

        {/* Quick Shortcuts */}
        {!sidebarCollapsed && !searchTerm && (
          <div className="px-4 mb-3 space-y-2">
            {/* הכנסה למלאי */}
            <Link
              to={createPageUrl("NewDelivery")}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                isNavItemActive("NewDelivery")
                  ? "bg-emerald-600/30 text-emerald-100 ring-1 ring-emerald-400/50"
                  : "bg-emerald-600/15 text-emerald-200 hover:bg-emerald-600/25"
              }`}
            >
              <ArrowDownToLine className="h-5 w-5 text-emerald-400" />
              <span className="font-semibold text-sm">הכנסה למלאי</span>
            </Link>

            {/* הוצאה מהמלאי */}
            <div>
              <button
                onClick={() => setOutStorageExpanded((p) => !p)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  location.pathname === createPageUrl("InventoryRemoval")
                    ? "bg-orange-600/30 text-orange-100 ring-1 ring-orange-400/50"
                    : "bg-orange-600/15 text-orange-200 hover:bg-orange-600/25"
                }`}
              >
                <div className="flex items-center gap-3">
                  <PackageMinus className="h-5 w-5 text-orange-400" />
                  <span className="font-semibold text-sm">הוצאה מהמלאי</span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-orange-300 transition-transform duration-200 ${outStorageExpanded ? "rotate-180" : ""}`}
                />
              </button>
              <AnimatePresence>
                {outStorageExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-1.5 mt-1.5 px-1">
                      {[
                        {
                          preset: "usage",
                          label: "שימוש",
                          Icon: Beaker,
                          color: "text-emerald-400",
                          bg: "hover:bg-emerald-600/20",
                        },
                        {
                          preset: "shipment",
                          label: "משלוח",
                          Icon: Truck,
                          color: "text-blue-400",
                          bg: "hover:bg-blue-600/20",
                        },
                        {
                          preset: "destroy",
                          label: "השמדה",
                          Icon: Trash2,
                          color: "text-red-400",
                          bg: "hover:bg-red-600/20",
                        },
                        {
                          preset: "other",
                          label: "סיבה אחרת",
                          Icon: FileText,
                          color: "text-slate-400",
                          bg: "hover:bg-slate-600/20",
                        },
                      ].map(({ preset, label, Icon, color, bg }) => (
                        <Link
                          key={preset}
                          to={`${createPageUrl("InventoryRemoval")}?preset=${preset}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-2 px-2.5 py-2 rounded-md text-xs font-medium text-slate-300 transition-colors ${bg}`}
                        >
                          <Icon className={`h-4 w-4 ${color}`} />
                          {label}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Accordion for Expanded Sidebar */}
        {!sidebarCollapsed && (
          <Accordion
            type="multiple"
            value={openAccordionGroups}
            onValueChange={setOpenAccordionGroups}
            className="w-full px-2 space-y-1"
          >
            {Object.entries(groupedNavItems).map(([groupName, items]) => {
              if (items.length === 0) return null; // Skip empty groups

              const groupInfo =
                groupHeadings[groupName] || groupHeadings.documentation;
              return (
                <AccordionItem
                  key={groupName}
                  value={groupName}
                  className="border-none"
                >
                  <AccordionTrigger className="w-full px-3 py-2 text-right hover:no-underline hover:bg-slate-700/30 rounded-lg">
                    <div
                      className={`flex items-center w-full text-sm font-bold uppercase tracking-wider ${groupInfo.textColor}`}
                    >
                      <span className="me-2 text-lg">{groupInfo.emoji}</span>
                      <span>{groupInfo.title}</span>
                      {searchTerm && (
                        <span className="ms-2 text-xs">({items.length})</span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-1">
                    {items.map((item) => (
                      <Link
                        key={item.name}
                        to={createPageUrl(item.href)}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`group flex items-center px-3 py-2.5 text-sm rounded-md transition-all duration-200 ease-in-out ${
                          isNavItemActive(item.href)
                            ? "bg-slate-700/80 text-white font-semibold"
                            : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                        }`}
                      >
                        <item.icon
                          className={`me-3 flex-shrink-0 h-5 w-5 transition-colors ${
                            isNavItemActive(item.href)
                              ? "text-white"
                              : `${groupInfo.iconColor} group-hover:text-white`
                          }`}
                        />
                        <span
                          className={`transition-colors group-hover:text-white ${
                            isNavItemActive(item.href)
                              ? "text-white"
                              : "text-slate-200"
                          }`}
                        >
                          {item.name}
                        </span>
                      </Link>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              );
            })}

            {user?.role === "admin" && filteredAdminNavItems.length > 0 && (
              <AccordionItem value="admin" className="border-none">
                <AccordionTrigger className="w-full px-3 py-2 text-right hover:no-underline hover:bg-slate-700/30 rounded-lg">
                  <div className="flex items-center w-full text-sm font-bold text-red-200 uppercase tracking-wider">
                    <span className="me-2 text-lg">⚙️</span>
                    <span>ניהול מתקדם</span>
                    {searchTerm && (
                      <span className="ms-2 text-xs">
                        ({filteredAdminNavItems.length})
                      </span>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-1">
                  {filteredAdminNavItems.map((item) => (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.href)}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`group flex items-center px-3 py-2.5 text-sm rounded-md transition-all duration-200 ease-in-out ${
                        isNavItemActive(item.href)
                          ? "bg-slate-700/80 text-white font-semibold"
                          : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                      }`}
                    >
                      <item.icon className="me-3 flex-shrink-0 h-5 w-5 text-red-400 group-hover:text-white transition-colors" />
                      <span className="text-slate-200 group-hover:text-white transition-colors">
                        {item.name}
                      </span>
                    </Link>
                  ))}
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        )}

        {/* Icon-only view for Collapsed Sidebar */}
        {sidebarCollapsed && (
          <nav className="mt-2 flex-1 px-2 space-y-1">
            {navItems.map((item) => {
              const groupInfo =
                groupHeadings[item.group] || groupHeadings.documentation;
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.href)}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`group flex items-center px-3 py-2.5 text-sm rounded-md transition-all duration-200 ease-in-out ${
                    isNavItemActive(item.href)
                      ? "bg-slate-700/80 text-white font-semibold"
                      : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                  }`}
                  title={item.name}
                >
                  <item.icon
                    className={`me-3 flex-shrink-0 h-5 w-5 transition-colors ${
                      isNavItemActive(item.href)
                        ? "text-white"
                        : `${groupInfo.iconColor} group-hover:text-white`
                    }`}
                  />
                </Link>
              );
            })}
            {user?.role === "admin" &&
              adminNavItems.map((item) => (
                <Link
                  key={item.name}
                  to={createPageUrl(item.href)}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`group flex items-center px-3 py-2.5 text-sm rounded-md transition-all duration-200 ease-in-out ${
                    isNavItemActive(item.href)
                      ? "bg-slate-700/80 text-white font-semibold"
                      : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                  }`}
                  title={item.name}
                >
                  <item.icon className="me-3 flex-shrink-0 h-5 w-5 text-red-400 group-hover:text-white transition-colors" />
                </Link>
              ))}
          </nav>
        )}

        {!sidebarCollapsed && <SidebarNotifications />}
      </div>
    </>
  );

  return (
    <SystemLockProvider>
      <div className="flex h-screen bg-slate-50 overflow-hidden" dir="rtl">
        {user && (
          <Suspense fallback={null}>
            <SecurityMonitor user={user} />
          </Suspense>
        )}

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <div className="fixed inset-0 flex z-50 lg:hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 bg-slate-600/30 backdrop-blur-sm"
                onClick={() => setMobileMenuOpen(false)}
              />

              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="relative flex-1 flex flex-col max-w-xs w-full glassmorphism-dark shadow-2xl"
              >
                <div className="absolute top-0 start-0 -ms-12 pt-2">
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="ms-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white/50 glassmorphism"
                  >
                    <X className="h-6 w-6 text-white" />
                  </button>
                </div>
                {sidebarContent}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:flex-shrink-0">
          <div
            className={`flex flex-col transition-all duration-300 ${sidebarCollapsed ? "w-16" : "w-64"}`}
          >
            <div className="flex flex-col h-0 flex-1 glassmorphism-dark">
              {sidebarContent}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          {/* Fixed Top Header */}
          <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow-sm border-b border-slate-200">
            <div className="flex items-center justify-between w-full px-4 sm:px-6 lg:px-8">
              {/* Right side (for RTL): Hamburger (far right), Sidebar Toggle, Back Button, User Profile */}
              <div className="flex items-center gap-3">
                {/* Mobile hamburger - far right in RTL */}
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden p-2 rounded-md text-slate-500 hover:text-slate-600 focus:outline-none"
                >
                  <Menu className="h-6 w-6" />
                </button>

                {/* Desktop Sidebar Toggle - right after hamburger */}
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="hidden lg:block p-2 rounded-md text-slate-500 hover:text-slate-600 focus:outline-none"
                >
                  <Menu className="h-6 w-6" />
                </button>

                {/* Back Button with Dropdown History */}
                <DropdownMenu>
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBackClick}
                      disabled={!canGoBack}
                      className={`flex items-center gap-2 transition-colors ${
                        canGoBack
                          ? "hover:bg-slate-100 text-slate-700 hover:text-slate-900"
                          : "text-slate-400 cursor-not-allowed opacity-50"
                      }`}
                    >
                      <ArrowRight className="h-5 w-5" />
                      <span className="hidden sm:inline text-sm">חזור</span>
                    </Button>
                    {historyItems.length > 0 && (
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 h-8 w-6 hover:bg-slate-100"
                          disabled={!canGoBack}
                        >
                          <ChevronDown className="h-4 w-4 text-slate-600" />
                        </Button>
                      </DropdownMenuTrigger>
                    )}
                  </div>
                  {historyItems.length > 0 && (
                    <DropdownMenuContent align="start" className="w-64">
                      <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 border-b">
                        <div className="flex items-center gap-1">
                          <History className="h-3 w-3" />
                          <span>היסטוריית ניווט</span>
                        </div>
                      </div>
                      {historyItems.map((path, idx) => {
                        const pageName =
                          navItems.find(
                            (item) => createPageUrl(item.href) === path,
                          )?.name ||
                          adminNavItems.find(
                            (item) => createPageUrl(item.href) === path,
                          )?.name ||
                          "דף הבית";
                        return (
                          <DropdownMenuItem
                            key={`${path}-${idx}`}
                            onClick={() => handleHistoryItemClick(path)}
                            className="cursor-pointer text-right"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span>{pageName}</span>
                              <ArrowRight className="h-4 w-4 me-2 text-slate-400" />
                            </div>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  )}
                </DropdownMenu>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-10 w-10 rounded-full"
                    >
                      <Avatar className="h-10 w-10 border-2 border-slate-200">
                        <AvatarImage
                          src={user?.profile_picture_url}
                          alt={user?.full_name}
                        />
                        <AvatarFallback>
                          {user?.full_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56" align="end" forceMount>
                    <Label className="font-normal text-xs text-slate-500">
                      משתמש
                    </Label>
                    <p className="text-sm font-medium leading-none text-slate-900">
                      {user?.full_name}
                    </p>
                    <p className="text-xs leading-none text-slate-500 mt-1">
                      {user?.email}
                    </p>
                  </PopoverContent>
                </Popover>
                <h1 className="text-xl font-bold text-slate-800">
                  {systemDisplay.mainHeaderName}
                </h1>
              </div>

              <div className="flex-1" />

              {/* Left side (for RTL): App Logo + Name */}
              <div className="flex items-center gap-3">
                <img
                  src="/logo-text.png"
                  alt="Flow Control"
                  className="h-10 object-contain hidden lg:block"
                  loading="lazy"
                />
                <img
                  src="/logo-icon.png"
                  alt="לוגו"
                  className="h-10 w-10 rounded-md object-contain hidden lg:block"
                  loading="lazy"
                />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-6 px-4 sm:px-6 lg:px-8">{children}</div>
          </main>
        </div>
      </div>
    </SystemLockProvider>
  );
}
