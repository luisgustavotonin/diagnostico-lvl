import React from 'react';
import { Input } from "@/components/ui/input";

export default function CEPMask({ value, onChange, placeholder, className }) {
  const formatCEP = (digits) => {
    if (!digits) return '';
    const clean = digits.replace(/\D/g, '').slice(0, 8);
    if (clean.length <= 5) return clean;
    return `${clean.slice(0, 5)}-${clean.slice(5)}`;
  };

  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    onChange(raw);
  };

  return (
    <Input
      type="text"
      value={formatCEP(value || '')}
      onChange={handleChange}
      placeholder={placeholder || "99999-999"}
      className={className}
    />
  );
}