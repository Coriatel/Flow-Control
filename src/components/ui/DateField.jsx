import React from "react";
import { format, parse, isValid } from "date-fns";
import { he } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";

function toISO(date) {
  try {
    return format(date, "yyyy-MM-dd");
  } catch {
    return "";
  }
}

export default function DateField({ value, onChange, placeholder = "dd/MM/yyyy", disabled = false, min, max, className = "" }) {
  // value is ISO yyyy-MM-dd string or undefined
  const selectedDate = value ? parse(value, "yyyy-MM-dd", new Date()) : null;
  const display = selectedDate && isValid(selectedDate) ? format(selectedDate, "dd/MM/yyyy", { locale: he }) : "";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={`w-full justify-between text-right ${className}`}
        >
          <span className={`truncate ${display ? "text-gray-900" : "text-gray-400"}`}>
            {display || placeholder}
          </span>
          <CalendarIcon className="ml-2 h-4 w-4 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="single"
          selected={selectedDate && isValid(selectedDate) ? selectedDate : undefined}
          onSelect={(date) => onChange(date ? toISO(date) : "")}
          locale={he}
          initialFocus
          disabled={disabled}
          fromDate={min ? parse(min, "yyyy-MM-dd", new Date()) : undefined}
          toDate={max ? parse(max, "yyyy-MM-dd", new Date()) : undefined}
        />
      </PopoverContent>
    </Popover>
  );
}