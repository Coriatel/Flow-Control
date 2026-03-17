import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ExpiryCalendarActions from "./ExpiryCalendarActions";

const STATUS_COLORS = {
  expired: "bg-red-500",
  critical: "bg-orange-500",
  warning: "bg-yellow-500",
  ok: "bg-green-500",
};

function getExpiryStatus(daysUntilExpiry) {
  if (daysUntilExpiry <= 0) return "expired";
  if (daysUntilExpiry <= 2) return "critical";
  if (daysUntilExpiry <= 7) return "warning";
  return "ok";
}

const DAY_NAMES = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];

export default function ExpiryCalendar({ batches = [], onRefresh }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Group batches by date string (YYYY-MM-DD)
  const batchesByDate = useMemo(() => {
    const map = new Map();
    for (const b of batches) {
      const d = new Date(b.expiryDate);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const existing = map.get(dateStr) ?? [];
      existing.push(b);
      map.set(dateStr, existing);
    }
    return map;
  }, [batches]);

  // Calendar grid
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDay = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const weeks = [];
  let currentWeek = [];
  for (let i = 0; i < startDay; i++) currentWeek.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  const monthName = new Intl.DateTimeFormat("he-IL", {
    month: "long",
    year: "numeric",
  }).format(currentDate);

  // RTL: ChevronRight = prev, ChevronLeft = next
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getDotsForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const items = batchesByDate.get(dateStr);
    if (!items || items.length === 0) return null;

    const statuses = new Set(
      items.map((b) => getExpiryStatus(b.daysUntilExpiry))
    );
    return Array.from(statuses).map(
      (s) => STATUS_COLORS[s] ?? STATUS_COLORS.ok
    );
  };

  const handleDayClick = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDay(selectedDay === dateStr ? null : dateStr);
  };

  const selectedBatches = selectedDay
    ? batchesByDate.get(selectedDay) ?? []
    : [];

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <div className="space-y-3">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={nextMonth} className="p-2">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="font-semibold text-slate-800">{monthName}</span>
        <Button variant="ghost" size="sm" onClick={prevMonth} className="p-2">
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-0 text-center text-xs">
        {DAY_NAMES.map((d) => (
          <div key={d} className="py-1 font-medium text-slate-500">
            {d}
          </div>
        ))}

        {/* Calendar cells */}
        {weeks.flat().map((day, i) => {
          if (day === null)
            return <div key={`e-${i}`} className="py-2 md:py-3" />;

          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dots = getDotsForDay(day);
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDay;

          return (
            <button
              key={dateStr}
              onClick={() => handleDayClick(day)}
              className={`py-1.5 md:py-2 rounded-lg transition-colors relative flex flex-col items-center justify-center w-8 h-8 md:w-10 md:h-10 mx-auto text-xs md:text-sm ${
                isToday
                  ? "font-extrabold ring-2 ring-primary/30"
                  : ""
              } ${
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-slate-100"
              }`}
            >
              {day}
              {dots && (
                <div className="flex gap-0.5 justify-center absolute bottom-0.5 md:bottom-1">
                  {dots.slice(0, 3).map((color, j) => (
                    <span
                      key={j}
                      className={`h-1 w-1 md:h-1.5 md:w-1.5 rounded-full ${color}`}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-500 justify-center">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          פג תוקף
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-orange-500" />
          1-2 ימים
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-yellow-500" />
          3-7 ימים
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          8+ ימים
        </span>
      </div>

      {/* Selected day details */}
      {selectedDay && selectedBatches.length > 0 && (
        <ExpiryCalendarActions
          batches={selectedBatches}
          selectedDate={selectedDay}
          onRefresh={onRefresh}
        />
      )}

      {selectedDay && selectedBatches.length === 0 && (
        <div className="text-center py-3 text-sm text-slate-500 border rounded-lg">
          אין אצוות שפגות/פוקעות בתאריך זה
        </div>
      )}
    </div>
  );
}
