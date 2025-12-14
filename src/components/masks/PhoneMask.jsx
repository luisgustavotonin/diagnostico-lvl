import React from 'react';
import { Input } from "@/components/ui/input";

export default function PhoneMask({ value, onChange, placeholder, className }) {
  const formatPhone = (digits) => {
    if (!digits) return '';
    const clean = digits.replace(/\D/g, '').slice(0, 11);
    if (clean.length <= 2) return `(${clean}`;
    if (clean.length <= 6) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
    if (clean.length <= 10) return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  };

  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    onChange(raw);
  };

  return (
    <Input
      type="tel"
      value={formatPhone(value || '')}
      onChange={handleChange}
      placeholder={placeholder || "(99) 99999-9999"}
      className={className}
    />
  );
}