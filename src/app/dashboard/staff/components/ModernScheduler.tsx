"use client";

import { useState, useRef, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  DragStartEvent,
  DragEndEvent,
  closestCenter,
} from "@dnd-kit/core";
import { format, addHours, startOfDay, isSameDay } from "date-fns";
import ShiftTemplatesPanel from "./ShiftTemplatesPanel";
import { QuickShiftCreator } from "./QuickShiftCreator";
import { CoverageWarnings } from "./CoverageWarnings";
import { useToast } from "@/lib/design-system";

interface Member {
  id: number;
  userId: number;
  companyId: number;
  role: string;
  isActive: boolean;
  user: {
    id: number;
    name: string | null;
    email: string;
  };
}

interface Shift {
  id: number;
  membershipId: number;
  companyId: number;
  date: string;
  startTime: string;
  endTime: string;
  breakDuration: number;
  shiftType: string;
  location: string | null;
  status: string;
  notes: string | null;
  membership: {
    user: {
      name: string | null;
      email: string;
    };
  };
}

interface ModernSchedulerProps {
  companyId: number;
  members: Member[];
  canManageAll: boolean;
}

type UndoAction = {
  type: 'create' | 'update' | 'delete';
  shiftId: number;
  previousData?: Partial<Shift>;
  newData?: Partial<Shift>;
};

export default function ModernScheduler({
  companyId,
  members,
  canManageAll,
}: ModernSchedulerProps) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week">("week");
  const [draggedShift, setDraggedShift] = useState<Shift | null>(null);
  const [isCreatingShift, setIsCreatingShift] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{ staffId: number; hour: number } | null>(null);
  const [quickCreateData, setQuickCreateData] = useState<{ member: Member; date: Date; startHour: number } | null>(null);
  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);

  const { success, error: showError } = useToast();

  // Hours to display (6 AM to 12 AM)
  const hours = Array.from({ length: 18 }, (_, i) => i + 6);

  // Get week days
  const weekDays = getWeekDays(selectedDate);

  useEffect(() => {
    loadShifts();
  }, [selectedDate, viewMode]);

  async function loadShifts() {
    try {
      const startDate = viewMode === "day"
        ? format(selectedDate, "yyyy-MM-dd")
        : format(weekDays[0], "yyyy-MM-dd");
      const endDate = viewMode === "day"
        ? format(selectedDate, "yyyy-MM-dd")
        : format(weekDays[6], "yyyy-MM-dd");

      const res = await fetch(`/api/staff/shifts?startDate=${startDate}&endDate=${endDate}`);
      const data = await res.json();
      setShifts(data.shifts || []);
    } catch (error) {
      console.error("Failed to load shifts:", error);
    }
  }

  function getWeekDays(date: Date) {
    const start = startOfDay(date);
    const day = start.getDay();
    const diff = start.getDate() - day;
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(diff + i);
      return d;
    });
  }

  function getShiftTypeColor(shiftType: string) {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      general: { bg: "bg-blue-500", border: "border-blue-600", text: "text-blue-50" },
      opening: { bg: "bg-amber-500", border: "border-amber-600", text: "text-amber-50" },
      closing: { bg: "bg-indigo-500", border: "border-indigo-600", text: "text-indigo-50" },
      production: { bg: "bg-green-500", border: "border-green-600", text: "text-green-50" },
      service: { bg: "bg-purple-500", border: "border-purple-600", text: "text-purple-50" },
    };
    return colors[shiftType] || colors.general;
  }

  function handleDragStart(event: DragStartEvent) {
    const shift = shifts.find((s) => s.id === event.active.id);
    if (shift) {
      setDraggedShift(shift);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    setDraggedShift(null);

    if (!event.over || !event.active) return;

    // Extract staff ID from drop zone
    const overId = String(event.over.id);
    if (!overId.startsWith("staff-")) return;

    const newMembershipId = parseInt(overId.replace("staff-", ""));
    const shift = shifts.find((s) => s.id === event.active.id);
    if (!shift) return;

    // Save previous state for undo
    const previousData = {
      membershipId: shift.membershipId,
      startTime: shift.startTime,
      endTime: shift.endTime,
    };

    // Calculate the time offset from the drag delta
    const deltaX = event.delta.x;
    const hoursDelta = deltaX / 120; // 120px per hour

    const oldStart = new Date(shift.startTime);
    const oldEnd = new Date(shift.endTime);
    const duration = (oldEnd.getTime() - oldStart.getTime()) / (1000 * 60 * 60);

    const newStart = new Date(oldStart.getTime() + hoursDelta * 60 * 60 * 1000);
    const newEnd = new Date(newStart.getTime() + duration * 60 * 60 * 1000);

    const newData = {
      membershipId: newMembershipId,
      startTime: newStart.toISOString(),
      endTime: newEnd.toISOString(),
    };

    // Update shift via API
    try {
      const res = await fetch(`/api/staff/shifts/${shift.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newData),
      });

      if (res.ok) {
        await loadShifts();

        // Show success toast with undo
        success('Shift updated!', {
          label: 'Undo',
          onClick: () => handleUndo({
            type: 'update',
            shiftId: shift.id,
            previousData,
            newData,
          }),
        });
      } else {
        showError('Failed to update shift');
      }
    } catch (error) {
      console.error("Failed to update shift:", error);
      showError('Failed to update shift');
    }
  }

  async function handleApplyTemplate(template: any) {
    if (!canManageAll) return;

    // Apply template to all active staff for the current date
    const dateStr = format(viewMode === "day" ? selectedDate : weekDays[0], "yyyy-MM-dd");

    // Create shifts for each active staff member
    const promises = members.map(async (member) => {
      const startDateTime = new Date(`${dateStr}T${template.startTime}`);
      const endDateTime = new Date(`${dateStr}T${template.endTime}`);

      return fetch("/api/staff/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membershipId: member.id,
          date: dateStr,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          shiftType: template.shiftType,
          breakDuration: template.breakDuration,
          location: null,
          notes: `Applied from ${template.name} template`,
        }),
      });
    });

    try {
      await Promise.all(promises);
      await loadShifts();
      setShowTemplates(false);
    } catch (error) {
      console.error("Failed to apply template:", error);
    }
  }

  async function handleQuickCreate(shiftData: any) {
    try {
      const res = await fetch("/api/staff/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...shiftData, location: null, notes: null }),
      });

      if (res.ok) {
        const newShift = await res.json();
        await loadShifts();
        setQuickCreateData(null);

        // Show success toast with undo
        success('Shift created!', {
          label: 'Undo',
          onClick: () => handleUndo({
            type: 'create',
            shiftId: newShift.shift?.id || newShift.id,
            newData: shiftData,
          }),
        });
      } else {
        showError('Failed to create shift');
      }
    } catch (error) {
      console.error("Failed to create shift:", error);
      showError('Failed to create shift');
    }
  }

  async function handleUndo(action: UndoAction) {
    try {
      if (action.type === 'create') {
        // Delete the created shift
        const res = await fetch(`/api/staff/shifts/${action.shiftId}`, {
          method: "DELETE",
        });

        if (res.ok) {
          await loadShifts();
          success('Shift creation undone');
        }
      } else if (action.type === 'update' && action.previousData) {
        // Restore previous values
        const res = await fetch(`/api/staff/shifts/${action.shiftId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(action.previousData),
        });

        if (res.ok) {
          await loadShifts();
          success('Shift restored');
        }
      } else if (action.type === 'delete' && action.previousData) {
        // Recreate the deleted shift
        const res = await fetch("/api/staff/shifts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(action.previousData),
        });

        if (res.ok) {
          await loadShifts();
          success('Shift restored');
        }
      }
    } catch (error) {
      console.error("Failed to undo action:", error);
      showError('Failed to undo');
    }
  }

  function detectConflicts(shift: Shift): boolean {
    const shiftStart = new Date(shift.startTime).getTime();
    const shiftEnd = new Date(shift.endTime).getTime();
    return shifts.some((other) => {
      if (other.id === shift.id || other.membershipId !== shift.membershipId) return false;
      const otherStart = new Date(other.startTime).getTime();
      const otherEnd = new Date(other.endTime).getTime();
      return (shiftStart >= otherStart && shiftStart < otherEnd) || (shiftEnd > otherStart && shiftEnd <= otherEnd) || (shiftStart <= otherStart && shiftEnd >= otherEnd);
    });
  }

  function getShiftPosition(shift: Shift) {
    const startTime = new Date(shift.startTime);
    const hour = startTime.getHours();
    const minutes = startTime.getMinutes();
    const left = ((hour - 6) + minutes / 60) * 120; // 120px per hour

    const endTime = new Date(shift.endTime);
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    const width = duration * 120;

    return { left, width };
  }

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={closestCenter}
    >
      <div className="space-y-4">
        {/* Modern Header Controls */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("day")}
                  className={`px-4 py-2 rounded-md font-semibold text-sm transition-all ${
                    viewMode === "day"
                      ? "bg-white shadow-sm text-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Day
                </button>
                <button
                  onClick={() => setViewMode("week")}
                  className={`px-4 py-2 rounded-md font-semibold text-sm transition-all ${
                    viewMode === "week"
                      ? "bg-white shadow-sm text-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Week
                </button>
              </div>

              {/* Date Navigation */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setDate(newDate.getDate() - (viewMode === "day" ? 1 : 7));
                    setSelectedDate(newDate);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button
                  onClick={() => setSelectedDate(new Date())}
                  className="px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Today
                </button>

                <button
                  onClick={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setDate(newDate.getDate() + (viewMode === "day" ? 1 : 7));
                    setSelectedDate(newDate);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="text-lg font-bold text-gray-900">
                {viewMode === "week"
                  ? `${format(weekDays[0], "MMM d")} - ${format(weekDays[6], "MMM d, yyyy")}`
                  : format(selectedDate, "MMMM d, yyyy")}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Templates Button */}
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-semibold"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                <span>Templates</span>
              </button>

              {/* Create Shift Button */}
              {canManageAll && (
                <button
                  onClick={() => setIsCreatingShift(true)}
                  className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg font-semibold"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Create Shift</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3">
              <div className="text-xs font-semibold text-blue-600 uppercase">Total Hours</div>
              <div className="text-2xl font-bold text-blue-900 mt-1">
                {shifts.reduce((acc, shift) => {
                  const start = new Date(shift.startTime);
                  const end = new Date(shift.endTime);
                  return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                }, 0).toFixed(1)}h
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3">
              <div className="text-xs font-semibold text-green-600 uppercase">Shifts Scheduled</div>
              <div className="text-2xl font-bold text-green-900 mt-1">{shifts.length}</div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-3">
              <div className="text-xs font-semibold text-amber-600 uppercase">Staff Working</div>
              <div className="text-2xl font-bold text-amber-900 mt-1">
                {new Set(shifts.map(s => s.membershipId)).size}
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3">
              <div className="text-xs font-semibold text-purple-600 uppercase">Est. Cost</div>
              <div className="text-2xl font-bold text-purple-900 mt-1">£0</div>
            </div>
          </div>
        </div>

        {/* Coverage Warnings */}
        <CoverageWarnings
          shifts={shifts}
          members={members}
          maxHoursPerWeek={48}
          minStaffPerHour={2}
          maxStaffPerHour={8}
        />

        {/* Timeline Scheduler */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            {/* Time Header */}
            <div className="flex border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="w-48 flex-shrink-0 border-r border-gray-200 p-4 font-bold text-gray-700">
                Staff
              </div>
              <div className="flex flex-1 min-w-max">
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="w-30 border-r border-gray-200 p-2 text-center text-xs font-semibold text-gray-600"
                    style={{ width: "120px" }}
                  >
                    {format(new Date().setHours(hour, 0, 0, 0), "h a")}
                  </div>
                ))}
              </div>
            </div>

            {/* Staff Rows */}
            <div className="relative">
              {members.map((member, idx) => (
                <StaffRow
                  key={member.id}
                  member={member}
                  shifts={shifts.filter((s) => s.membershipId === member.id)}
                  hours={hours}
                  isEven={idx % 2 === 0}
                  getShiftPosition={getShiftPosition}
                  getShiftTypeColor={getShiftTypeColor}
                  detectConflicts={detectConflicts}
                  onCellClick={(hour) => setQuickCreateData({ member, date: weekDays[0], startHour: hour })}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-bold text-gray-700 mb-3">Shift Types</h3>
          <div className="flex flex-wrap gap-4">
            {["general", "opening", "closing", "production", "service"].map((type) => {
              const colors = getShiftTypeColor(type);
              return (
                <div key={type} className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded ${colors.bg}`}></div>
                  <span className="text-sm text-gray-600 capitalize font-medium">{type}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {draggedShift && (
          <div className="opacity-80">
            <ShiftBlock
              shift={draggedShift}
              position={{ left: 0, width: 200 }}
              getShiftTypeColor={getShiftTypeColor}
            />
          </div>
        )}
      </DragOverlay>

      {/* Templates Panel Modal */}
      {showTemplates && (
        <ShiftTemplatesPanel
          onClose={() => setShowTemplates(false)}
          onApplyTemplate={handleApplyTemplate}
        />
      )}

      {/* Quick Create Modal */}
      {quickCreateData && (
        <QuickShiftCreator
          member={quickCreateData.member}
          date={quickCreateData.date}
          startHour={quickCreateData.startHour}
          onClose={() => setQuickCreateData(null)}
          onSave={handleQuickCreate}
        />
      )}
    </DndContext>
  );
}

// Staff Row Component
function StaffRow({
  member,
  shifts,
  hours,
  isEven,
  getShiftPosition,
  getShiftTypeColor,
  detectConflicts,
  onCellClick,
}: {
  member: Member;
  shifts: Shift[];
  hours: number[];
  isEven: boolean;
  getShiftPosition: (shift: Shift) => { left: number; width: number };
  getShiftTypeColor: (type: string) => { bg: string; border: string; text: string };
  detectConflicts: (shift: Shift) => boolean;
  onCellClick: (hour: number) => void;
}) {
  const { setNodeRef } = useDroppable({
    id: `staff-${member.id}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex border-b border-gray-200 hover:bg-blue-50 transition-colors ${
        isEven ? "bg-white" : "bg-gray-50"
      }`}
    >
      {/* Staff Name */}
      <div className="w-48 flex-shrink-0 border-r border-gray-200 p-4 flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
          {(member.user.name?.[0] || member.user.email[0]).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-900 truncate">
            {member.user.name || "Staff"}
          </div>
          <div className="text-xs text-gray-500 truncate">{member.role}</div>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="flex-1 relative min-w-max" style={{ height: "80px" }}>
        {/* Clickable Grid Cells */}
        <div className="absolute inset-0 flex">
          {hours.map((hour) => (
            <div
              key={hour}
              onClick={() => onCellClick(hour)}
              className="border-r border-gray-100 hover:bg-blue-100 cursor-pointer transition-colors group"
              style={{ width: "120px" }}
              title="Click to create shift"
            >
              <div className="opacity-0 group-hover:opacity-100 flex items-center justify-center h-full text-blue-600 text-xs font-semibold">
                +
              </div>
            </div>
          ))}
        </div>

        {/* Shifts */}
        {shifts.map((shift) => {
          const position = getShiftPosition(shift);
          const hasConflict = detectConflicts(shift);
          return (
            <div
              key={shift.id}
              className="absolute top-2 bottom-2"
              style={{
                left: `${position.left}px`,
                width: `${position.width}px`,
              }}
            >
              <ShiftBlock
                shift={shift}
                position={position}
                getShiftTypeColor={getShiftTypeColor}
                hasConflict={hasConflict}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Draggable Shift Block
function ShiftBlock({
  shift,
  position,
  getShiftTypeColor,
  hasConflict = false,
}: {
  shift: Shift;
  position: { left: number; width: number };
  getShiftTypeColor: (type: string) => { bg: string; border: string; text: string };
  hasConflict?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: shift.id,
  });

  const colors = getShiftTypeColor(shift.shiftType);
  const startTime = new Date(shift.startTime);
  const endTime = new Date(shift.endTime);

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`relative h-full ${colors.bg} ${hasConflict ? 'border-red-600 animate-pulse' : colors.border} border-2 rounded-lg p-2 cursor-move hover:shadow-lg transition-all ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      {hasConflict && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold" title="Schedule conflict!">
          !
        </div>
      )}
      <div className={`text-xs font-bold ${colors.text} truncate`}>
        {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
      </div>
      {shift.location && (
        <div className={`text-xs ${colors.text} opacity-80 truncate mt-1`}>
          📍 {shift.location}
        </div>
      )}
    </div>
  );
}
