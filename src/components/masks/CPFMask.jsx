import React from 'react';
import { Input } from "@/components/ui/input";

export default function CPFMask({ value, onChange, placeholder, className }) {
  const formatCPF = (value) => {
    if (!value) return '';
    const clean = value.replace(/\D/g, '').slice(0, 11);
    if (clean.length <= 3) return clean;
    if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
    if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
  };

  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    onChange(raw);
  };

  return (
    <Input
      type="text"
      value={formatCPF(value)}
      onChange={handleChange}
      placeholder={placeholder || 'XXX.XXX.XXX-XX'}
      className={className}
    />
  );
}