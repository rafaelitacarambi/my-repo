// src/components/ui/CurrencyInput.tsx
import React, { useState, useEffect } from "react";
import { Input } from "./input";
import { formatCurrency, handleCurrencyInput } from "@/lib/input-masks";

interface CurrencyInputProps {
  value: number | undefined;
  onValueChange: (numeric: number) => void;
  placeholder?: string;
  className?: string;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onValueChange,
  placeholder = "R$ 0,00",
  className,
}) => {
  const [tempValue, setTempValue] = useState<string>("");
  const [isFocused, setIsFocused] = useState(false);

  // Sync tempValue with value when not focused
  useEffect(() => {
    if (!isFocused) {
      setTempValue(value !== undefined && value !== null ? formatCurrency(value) : "");
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "") {
      setTempValue("");
      onValueChange(0);
      return;
    }
    const { displayValue, numericValue } = handleCurrencyInput(val);
    setTempValue(displayValue);
    onValueChange(numericValue);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    e.target.select();
  };

  const handleBlur = () => {
    setIsFocused(false);
    setTempValue(value !== undefined && value !== null ? formatCurrency(value) : "");
  };

  return (
    <Input
      type="text"
      value={tempValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
    />
  );
};

