import React from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PhoneMask from '../masks/PhoneMask';
import CNPJMask from '../masks/CNPJMask';
import CEPMask from '../masks/CEPMask';
import CurrencyMask from '../masks/CurrencyMask';
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function QuestionField({ question, value, onChange, error }) {
  const renderField = () => {
    switch (question.field_type) {
      case 'text':
        return (
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder}
            className={error ? 'border-red-500' : ''}
            rows={4}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'email':
        return (
          <Input
            type="email"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'phone':
        return (
          <PhoneMask
            value={value}
            onChange={onChange}
            placeholder={question.placeholder}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'cnpj':
        return (
          <CNPJMask
            value={value}
            onChange={onChange}
            placeholder={question.placeholder}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'cep':
        return (
          <CEPMask
            value={value}
            onChange={onChange}
            placeholder={question.placeholder}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'currency_cents':
        return (
          <CurrencyMask
            value={value}
            onChange={onChange}
            placeholder={question.placeholder}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'yes_no':
        return (
          <RadioGroup
            value={value || ''}
            onValueChange={onChange}
            className="flex gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Sim" id={`${question.field_key}-sim`} />
              <Label htmlFor={`${question.field_key}-sim`} className="cursor-pointer">Sim</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Não" id={`${question.field_key}-nao`} />
              <Label htmlFor={`${question.field_key}-nao`} className="cursor-pointer">Não</Label>
            </div>
          </RadioGroup>
        );

      case 'radio':
        return (
          <RadioGroup
            value={value || ''}
            onValueChange={onChange}
            className="space-y-2"
          >
            {(question.options || []).map((option, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.field_key}-${idx}`} />
                <Label htmlFor={`${question.field_key}-${idx}`} className="cursor-pointer">{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'select':
        return (
          <Select value={value || ''} onValueChange={onChange}>
            <SelectTrigger className={error ? 'border-red-500' : ''}>
              <SelectValue placeholder={question.placeholder || "Selecione..."} />
            </SelectTrigger>
            <SelectContent>
              {(question.options || []).map((option, idx) => (
                <SelectItem key={idx} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'checkbox':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {(question.options || []).map((option, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.field_key}-${idx}`}
                  checked={selectedValues.includes(option)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange([...selectedValues, option]);
                    } else {
                      onChange(selectedValues.filter(v => v !== option));
                    }
                  }}
                />
                <Label htmlFor={`${question.field_key}-${idx}`} className="cursor-pointer">{option}</Label>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder}
            className={error ? 'border-red-500' : ''}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <Label className={`text-base font-medium ${error ? 'text-red-600' : 'text-slate-700'}`}>
          {question.text}
          {question.is_required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {question.help_text && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="w-4 h-4 text-slate-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{question.help_text}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {renderField()}
      {error && (
        <p className="text-sm text-red-600">Este campo é obrigatório</p>
      )}
    </div>
  );
}