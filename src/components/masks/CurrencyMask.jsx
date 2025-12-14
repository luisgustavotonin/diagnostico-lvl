import React from 'react';
import { Input } from "@/components/ui/input";

export default function CurrencyMask({ value, onChange, placeholder, className }) {
  // value é armazenado em centavos (inteiro)
  const formatCurrency = (cents) => {
    if (cents === null || cents === undefined || cents === '') return 'R$ 0,00';
    const num = parseInt(cents, 10) || 0;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num / 100);
  };

  const handleChange = (e) => {
    // Remove tudo que não é dígito
    const raw = e.target.value.replace(/\D/g, '');
    // Converte para inteiro (centavos)
    const cents = parseInt(raw, 10) || 0;
    onChange(cents);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const currentCents = parseInt(value, 10) || 0;
      const newCents = Math.floor(currentCents / 10);
      onChange(newCents);
    }
  };

  return (
    <Input
      type="text"
      value={formatCurrency(value)}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder || "R$ 0,00"}
      className={className}
    />
  );
}