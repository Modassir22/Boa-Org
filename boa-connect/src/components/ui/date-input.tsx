import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  label?: string;
}

export function DateInput({ 
  value, 
  onChange, 
  placeholder = "DD/MM/YYYY or use date picker", 
  required = false,
  className,
  label 
}: DateInputProps) {
  const [inputMode, setInputMode] = useState<'picker' | 'manual'>('picker');
  const [manualValue, setManualValue] = useState('');

  useEffect(() => {
    // Convert date picker format (YYYY-MM-DD) to display format (DD/MM/YYYY)
    if (value && inputMode === 'picker') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        setManualValue(`${day}/${month}/${year}`);
      }
    }
  }, [value, inputMode]);

  const handleManualChange = (inputValue: string) => {
    setManualValue(inputValue);
    
    // Try to parse manual input and convert to date picker format
    const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = inputValue.match(dateRegex);
    
    if (match) {
      const [, day, month, year] = match;
      const dayNum = parseInt(day);
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      
      // Validate date ranges
      if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12 && yearNum >= 1900 && yearNum <= 2100) {
        // Convert to YYYY-MM-DD format for the date picker
        const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        onChange(formattedDate);
      }
    } else if (inputValue === '') {
      onChange('');
    }
  };

  const handleDatePickerChange = (dateValue: string) => {
    onChange(dateValue);
    
    // Update manual display
    if (dateValue) {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        setManualValue(`${day}/${month}/${year}`);
      }
    } else {
      setManualValue('');
    }
  };

  const toggleInputMode = () => {
    setInputMode(inputMode === 'picker' ? 'manual' : 'picker');
  };

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">
            {label} {required && <span className="text-destructive">*</span>}
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleInputMode}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            {inputMode === 'picker' ? (
              <>
                <Edit3 className="h-3 w-3 mr-1" />
                Type manually
              </>
            ) : (
              <>
                <Calendar className="h-3 w-3 mr-1" />
                Use date picker
              </>
            )}
          </Button>
        </div>
      )}
      
      <div className="relative">
        {inputMode === 'picker' ? (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleDatePickerChange(e.target.value)}
            required={required}
            className={cn("pr-10", className)}
          />
        ) : (
          <Input
            type="text"
            value={manualValue}
            onChange={(e) => handleManualChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            className={cn("pr-10", className)}
            maxLength={10}
          />
        )}
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleInputMode}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
        >
          {inputMode === 'picker' ? (
            <Edit3 className="h-4 w-4" />
          ) : (
            <Calendar className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {inputMode === 'manual' && (
        <p className="text-xs text-muted-foreground">
          Format: DD/MM/YYYY (e.g., 15/08/1990)
        </p>
      )}
    </div>
  );
}