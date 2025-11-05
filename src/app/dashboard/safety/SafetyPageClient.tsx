"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SafetyDiary } from "@/components/safety/SafetyDiary";
import { TaskList } from "@/components/safety/TaskList";
import { TemplateLibrary } from "@/components/safety/TemplateLibrary";
import { CompliancePage } from "@/components/safety/CompliancePage";
import { TemperatureMonitoringPage } from "@/components/safety/TemperatureMonitoringPage";
import { QuickActionsBar } from "@/components/safety/QuickActionsBar";

type SafetyPage = "diary" | "tasks" | "compliance" | "templates" | "temperatures";

export function SafetyPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pageParam = searchParams.get("page") || "diary";
  const [currentPage, setCurrentPage] = useState<SafetyPage>(pageParam as SafetyPage || "diary");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Update page when URL param changes and set default if missing
  useEffect(() => {
    const page = searchParams.get("page");
    if (!page) {
      // If no page param, set it to diary
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", "diary");
      router.replace(`/dashboard/safety?${params.toString()}`);
    } else {
      setCurrentPage(page as SafetyPage);
    }
  }, [searchParams, router]);

  return (
    <>
      <div className="flex flex-col h-full pb-20 md:pb-6">
        {/* Main Content - FloatingNavigation handles the top nav */}
        <div className="flex-1 overflow-auto">
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-gray-200/60 shadow-lg p-6">
            {currentPage === "diary" && (
              <SafetyDiary selectedDate={selectedDate} onDateChange={setSelectedDate} />
            )}
            {currentPage === "tasks" && (
              <TaskList selectedDate={selectedDate} />
            )}
            {currentPage === "compliance" && (
              <CompliancePage />
            )}
            {currentPage === "templates" && (
              <TemplateLibrary />
            )}
            {currentPage === "temperatures" && (
              <TemperatureMonitoringPage selectedDate={selectedDate} />
            )}
          </div>
        </div>
      </div>

      {/* Mobile Quick Actions Bar */}
      <QuickActionsBar />
    </>
  );
}

