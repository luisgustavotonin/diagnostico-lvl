import React from 'react';
import { Input } from "@/components/ui/input";

export default function CNPJMask({ value, onChange, placeholder, className }) {
  const formatCNPJ = (digits) => {
    if (!digits) return '';
    const clean = digits.replace(/\D/g, '').slice(0, 14);
    if (clean.length <= 2) return clean;
    if (clean.length <= 5) return `${clean.slice(0, 2)}.${clean.slice(2)}`;
    if (clean.length <= 8) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5)}`;
    if (clean.length <= 12) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8)}`;
    return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12)}`;
  };

  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    onChange(raw);
  };

  return (
    <Input
      type="text"
      value={formatCNPJ(value || '')}
      onChange={handleChange}
      placeholder={placeholder || "99.999.999/9999-99"}
      className={className}
    />
  );
}