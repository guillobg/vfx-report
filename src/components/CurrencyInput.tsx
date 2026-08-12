"use client";

import { useState, useEffect } from "react";
import { UseFormReturn, FieldPath } from "react-hook-form";
import { FullReport } from "@/lib/schemas";

interface CurrencyInputProps {
  form: UseFormReturn<FullReport>;
  name: FieldPath<FullReport>;
  className?: string;
  placeholder?: string;
}

function formatNumber(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num) || num === 0) return "";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function parseFormattedNumber(formatted: string): number {
  const cleaned = formatted.replace(/,/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export function CurrencyInput({ form, name, className = "", placeholder = "0" }: CurrencyInputProps) {
  const value = form.watch(name) as number;
  const [displayValue, setDisplayValue] = useState(formatNumber(value));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatNumber(value));
    }
  }, [value, isFocused]);

  return (
    <input
      type="text"
      inputMode="decimal"
      value={isFocused ? displayValue : formatNumber(value)}
      placeholder={placeholder}
      className={className}
      onFocus={(e) => {
        setIsFocused(true);
        // Show raw number on focus for easier editing
        const raw = value ? value.toString() : "";
        setDisplayValue(raw);
        setTimeout(() => e.target.select(), 0);
      }}
      onBlur={() => {
        setIsFocused(false);
        const num = parseFormattedNumber(displayValue);
        form.setValue(name, num as any, { shouldValidate: true });
        setDisplayValue(formatNumber(num));
      }}
      onChange={(e) => {
        const raw = e.target.value;
        // Allow only digits, commas, and periods
        if (/^[\d,.\s]*$/.test(raw)) {
          setDisplayValue(raw);
        }
      }}
    />
  );
}
