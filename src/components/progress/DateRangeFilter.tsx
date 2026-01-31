import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DateRangeFilterProps {
  value: number;
  onChange: (days: number) => void;
}

export const DateRangeFilter = ({ value, onChange }: DateRangeFilterProps) => {
  const [inputValue, setInputValue] = useState(String(value));

  useEffect(() => {
    setInputValue(String(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setInputValue(rawValue);
  };

  const handleBlur = () => {
    let numValue = parseInt(inputValue, 10);
    
    // Validate input
    if (isNaN(numValue) || numValue <= 0) {
      numValue = 30; // Default
    } else if (numValue > 730) {
      numValue = 730; // Max 2 years
    }
    
    setInputValue(String(numValue));
    onChange(numValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="dateRange" className="text-sm text-muted-foreground whitespace-nowrap">
        View last
      </Label>
      <Input
        id="dateRange"
        type="number"
        min={1}
        max={730}
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-20 h-9 text-center"
      />
      <span className="text-sm text-muted-foreground">days</span>
    </div>
  );
};
