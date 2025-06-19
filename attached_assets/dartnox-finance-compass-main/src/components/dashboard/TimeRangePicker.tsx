
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TimeRangePickerProps {
  selectedRange: string;
  onRangeChange: (range: string) => void;
}

export function TimeRangePicker({ selectedRange, onRangeChange }: TimeRangePickerProps) {
  const ranges = [
    { id: 'day', label: 'Day' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'quarter', label: 'Quarter' },
    { id: 'year', label: 'Year' },
  ];

  return (
    <div className="flex items-center bg-muted rounded-lg p-1">
      {ranges.map((range) => (
        <Button
          key={range.id}
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 px-3 text-sm font-medium transition-all",
            selectedRange === range.id
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => onRangeChange(range.id)}
        >
          {range.label}
        </Button>
      ))}
    </div>
  );
}
