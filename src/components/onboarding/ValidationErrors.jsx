import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ValidationErrors({ errors, questions }) {
  const errorFields = Object.keys(errors).filter(key => errors[key]);
  
  if (errorFields.length === 0) return null;

  const getQuestionText = (fieldKey) => {
    const question = questions.find(q => q.field_key === fieldKey);
    return question ? question.text : fieldKey;
  };

  return (
    <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Campos obrigatórios pendentes</AlertTitle>
      <AlertDescription>
        <ul className="mt-2 list-disc list-inside space-y-1">
          {errorFields.map(field => (
            <li key={field} className="text-sm">
              {getQuestionText(field)}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}