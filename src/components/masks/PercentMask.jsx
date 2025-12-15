import React from 'react';
import { Input } from "@/components/ui/input";

const formatPercent = (value) => {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits);
  return `${Math.min(num, 100)}%`;
};

export default function PercentMask({ value, onChange, ...props }) {
  const handleChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    onChange(rawValue ? parseInt(rawValue) : '');
  };

  return (
    <Input
      {...props}
      value={formatPercent(String(value || ''))}
      onChange={handleChange}
    />
  );
}