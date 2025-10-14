"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { useTimers } from "@/contexts/TimerContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationCenter } from "@/components/NotificationCenter";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface User {
  id: number;
  email: string;
  name?: string;
}

interface Company {
  id: number;
  name: string;
  businessType?: string;
  country?: string;
  phone?: string;
  logoUrl?: string;
}

interface Timer {
  id: string;
  recipeId: number;
  recipeName: string;
  stepTitle: string;
  totalMinutes: number;
  remaining: number;
  alarmInterval?: NodeJS.Timeout | null;
}

// Sortable Timer Item Component
function SortableTimerItem({
  timer,
  isExpanded,
  onExpand,
  onStop,
  onStopAlarm,
  onNavigate,
}: {
  timer: Timer;
  isExpanded: boolean;
  onExpand: () => void;
  onStop: () => void;
  onStopAlarm: () => void;
  onNavigate: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: timer.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isAlarmPlaying = timer.remaining === 0 && timer.alarmInterval;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border-t border-amber-200"
    >
      <div className={`p-3 hover:bg-amber-50 transition-all ${isExpanded ? 'bg-amber-50 py-5' : ''} ${isAlarmPlaying ? 'bg-red-50' : ''}`}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            {/* Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing flex items-center justify-center text-amber-400 hover:text-amber-600 mt-0.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
            </div>
            
            <button
              onClick={onNavigate}
              className="flex-1 min-w-0 text-left"
            >
              <p className={`font-semibold text-gray-900 truncate hover:text-emerald-600 transition-colors ${isExpanded ? 'text-base' : 'text-xs'}`}>
                {timer.recipeName}
              </p>
              <p className={`text-gray-600 truncate font-medium ${isExpanded ? 'text-sm mt-1' : 'text-sm'}`}>
                {timer.stepTitle}
              </p>
            </button>
          </div>
          
          <button
            onClick={onStop}
            className="flex-shrink-0 text-gray-400 hover:text-red-600 transition-colors"
            title="Stop timer"
          >
            <svg className={`${isExpanded ? 'w-5 h-5' : 'w-3.5 h-3.5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Alarm Playing Warning */}
        {isAlarmPlaying && (
          <div className="mb-2 flex items-center gap-2 bg-red-100 border border-red-300 rounded-lg px-3 py-2">
            <svg className="w-4 h-4 text-red-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="text-xs font-semibold text-red-700 flex-1">Timer Complete!</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStopAlarm();
              }}
              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors"
            >
              Stop Alarm
            </button>
          </div>
        )}
        
        <button
          onClick={onExpand}
          className="w-full flex items-center gap-3 group"
        >
          <span className={`font-bold font-mono transition-all ${isExpanded ? 'text-4xl' : 'text-lg'} ${isAlarmPlaying ? 'text-red-600 animate-pulse' : 'text-amber-700'}`}>
            {formatTime(timer.remaining)}
          </span>
          <div className={`flex-1 ${isExpanded ? 'h-3' : 'h-1.5'} bg-gray-200 rounded-full overflow-hidden transition-all`}>
            <div
              className={`h-full transition-all duration-1000 ${isAlarmPlaying ? 'bg-red-500' : 'bg-gradient-to-r from-emerald-500 to-amber-500'}`}
              style={{ width: `${(timer.remaining / (timer.totalMinutes * 60)) * 100}%` }}
            ></div>
          </div>
          {!isExpanded && (
            <svg className="w-3 h-3 text-gray-400 group-hover:text-amber-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [timersExpanded, setTimersExpanded] = useState(true);
  const [expandedTimerId, setExpandedTimerId] = useState<string | null>(null);
  const [timerOrder, setTimerOrder] = useState<string[]>([]);
  const [expandedNavItem, setExpandedNavItem] = useState<string | null>(null);
  const { timers, stopTimer, stopAlarm } = useTimers();
  
  // Drag and drop sensor
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    })
  );
  
  // Sort timers by remaining time (ending soonest first)
  const sortedTimerIds = useMemo(() => {
    const timerArray = Object.values(timers);
    timerArray.sort((a, b) => a.remaining - b.remaining);
    return timerArray.map(t => t.id);
  }, [timers]);
  
  // Use custom order if set, otherwise use auto-sorted order
  const displayOrder = timerOrder.length > 0 ? timerOrder : sortedTimerIds;
  
  // Update timer order when timers change
  useEffect(() => {
    // Only update if we don't have a custom order
    if (timerOrder.length === 0) {
      setTimerOrder(sortedTimerIds);
    }
  }, [sortedTimerIds, timerOrder.length]);

  useEffect(() => {
    fetch("/api/session")
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        setCompany(data.company);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setCompany(null);
        setLoading(false);
      });
  }, []);

  const handleSignOut = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      setUser(null);
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const isActive = (path: string) => pathname === path;

  const navItems = [
    { 
      href: "/dashboard", 
      label: "Dashboard", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
        </svg>
      )
    },
    { 
      href: "/dashboard/ingredients", 
      label: "Ingredients", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    { 
      href: "/dashboard/recipes", 
      label: "Recipes", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    { 
      href: "/dashboard/production", 
      label: "Production", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    },
    { 
      href: "/dashboard/inventory", 
      label: "Inventory", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    { 
      href: "/dashboard/wholesale", 
      label: "Wholesale", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      subItems: [
        { href: "/dashboard/wholesale", label: "Customers" },
        { href: "/dashboard/wholesale/orders", label: "Orders" },
        { href: "/dashboard/wholesale/products", label: "Products" },
      ]
    },
    { 
      href: "/dashboard/recipe-mixer", 
      label: "Recipe Mixer", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      )
    },
    { 
      href: "/dashboard/analytics", 
      label: "Analytics", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    { 
      href: "/dashboard/team", 
      label: "Team", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    { 
      href: "/dashboard/business", 
      label: "Business", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    { 
      href: "/dashboard/account", 
      label: "Settings", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-gray-50 z-40 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 w-64 border-r border-gray-200`}
      >
        <div className="flex flex-col h-full">
          {/* Business/Company Section */}
          <div className="p-4 bg-white border-b border-gray-200">
            <Link href="/dashboard" onClick={() => setIsOpen(false)} className="block">
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  {/* Company Logo or Plato Logo */}
                  {company?.logoUrl ? (
                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                      <Image
                        src={company.logoUrl}
                        alt={company.name}
                        width={32}
                        height={32}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0">
                      P
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    {/* Business Name - Shows the user's business name */}
                    <h1 className="text-sm font-semibold text-gray-900 truncate">
                      {loading ? "Loading..." : company?.name || "Plato Kitchen"}
                    </h1>
                    <p className="text-xs text-gray-500 truncate">
                      {company?.businessType || "Management"}
                    </p>
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="p-3 bg-gray-50">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
            {navItems.map((item: any) => (
              <div key={item.href}>
                {item.subItems ? (
                  // Nav item with sub-items
                  <div>
                    <button
                      onClick={() => setExpandedNavItem(expandedNavItem === item.href ? null : item.href)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                        pathname.startsWith(item.href)
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-gray-700 hover:bg-white hover:text-gray-900"
                      }`}
                    >
                      <div className={`${pathname.startsWith(item.href) ? "text-emerald-600" : "text-gray-500 group-hover:text-gray-700"}`}>
                        {item.icon}
                      </div>
                      <span className={`text-sm font-medium ${pathname.startsWith(item.href) ? "font-semibold" : ""}`}>
                        {item.label}
                      </span>
                      <svg 
                        className={`ml-auto w-4 h-4 transition-transform ${expandedNavItem === item.href || pathname.startsWith(item.href) ? 'rotate-90' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    {(expandedNavItem === item.href || pathname.startsWith(item.href)) && (
                      <div className="ml-8 mt-1 space-y-1">
                        {item.subItems.map((subItem: any) => (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            onClick={() => setIsOpen(false)}
                            className={`block px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                              isActive(subItem.href)
                                ? "bg-emerald-500 text-white shadow-sm font-medium"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            }`}
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // Regular nav item
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                      isActive(item.href)
                        ? "bg-emerald-500 text-white shadow-sm"
                        : "text-gray-700 hover:bg-white hover:text-gray-900"
                    }`}
                  >
                    <div className={`${isActive(item.href) ? "text-white" : "text-gray-500 group-hover:text-gray-700"}`}>
                      {item.icon}
                    </div>
                    <span className={`text-sm font-medium ${isActive(item.href) ? "font-semibold" : ""}`}>
                      {item.label}
                    </span>
                    {isActive(item.href) && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Bottom Utility Section */}
          <div className="p-3 space-y-2">
            {/* Active Timers */}
            {Object.keys(timers).length > 0 && (
              <div className="bg-white rounded-lg border border-amber-300 shadow-sm overflow-hidden">
                <div>
                  <button
                    onClick={() => setTimersExpanded(!timersExpanded)}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-amber-50 hover:bg-amber-100 transition-colors"
                  >
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-semibold text-amber-900">
                      Active Timers ({Object.keys(timers).length})
                    </span>
                    <svg
                      className={`ml-auto w-4 h-4 text-amber-600 transition-transform ${timersExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {timersExpanded && Object.keys(timers).length > 1 && (
                    <div className="px-3 py-1 bg-amber-50 border-t border-amber-200">
                      <p className="text-xs text-amber-700 italic flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                        Drag to reorder
                      </p>
                    </div>
                  )}
                </div>
                
                {timersExpanded && (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event: DragEndEvent) => {
                      const { active, over } = event;
                      if (over && active.id !== over.id) {
                        setTimerOrder((order) => {
                          const oldIndex = order.indexOf(active.id as string);
                          const newIndex = order.indexOf(over.id as string);
                          return arrayMove(order, oldIndex, newIndex);
                        });
                      }
                    }}
                  >
                    <SortableContext items={displayOrder} strategy={verticalListSortingStrategy}>
                      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 400px)' }}>
                        {displayOrder.map((timerId) => {
                          const timer = timers[timerId];
                          if (!timer) return null;
                          
                          return (
                            <SortableTimerItem
                              key={timer.id}
                              timer={timer}
                              isExpanded={expandedTimerId === timer.id}
                              onExpand={() => setExpandedTimerId(expandedTimerId === timer.id ? null : timer.id)}
                              onStop={() => {
                                stopTimer(timer.id);
                                // Remove from custom order
                                setTimerOrder(order => order.filter(id => id !== timer.id));
                              }}
                              onStopAlarm={() => stopAlarm(timer.id)}
                              onNavigate={() => {
                                router.push(`/dashboard/recipes/${timer.recipeId}`);
                                setIsOpen(false);
                              }}
                            />
                          );
                        })}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            )}

            {/* User Section */}
            {loading ? (
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 rounded animate-pulse mb-1"></div>
                  <div className="h-2.5 bg-gray-200 rounded animate-pulse w-2/3"></div>
                </div>
              </div>
            ) : user ? (
              <div className="space-y-1">
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-semibold">
                    {user.name?.[0] || user.email[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name || "My Account"}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <NotificationCenter />
                    <ThemeToggle />
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-white hover:text-gray-900 transition-all duration-200 text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Link
                  href="/login?redirect=/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="block w-full px-3 py-2 rounded-lg text-center text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-all duration-200"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsOpen(false)}
                  className="block w-full px-3 py-2 rounded-lg text-center text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-all duration-200"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

