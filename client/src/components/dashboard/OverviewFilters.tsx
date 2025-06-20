import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TimeRangePicker } from './TimeRangePicker';
import { useQuery } from '@tanstack/react-query';
import { X, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface OverviewFiltersProps {
  selectedClient?: string;
  selectedEmployee?: string;
  selectedCategory?: string;
  dateRange: { from: Date; to: Date };
  timeRange: string;
  onClientChange: (value?: string) => void;
  onEmployeeChange: (value?: string) => void;
  onCategoryChange: (value?: string) => void;
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
  onTimeRangeChange: (range: string) => void;
  onClearFilters: () => void;
}

export function OverviewFilters({
  selectedClient,
  selectedEmployee,
  selectedCategory,
  dateRange,
  timeRange,
  onClientChange,
  onEmployeeChange,
  onCategoryChange,
  onDateRangeChange,
  onTimeRangeChange,
  onClearFilters
}: OverviewFiltersProps) {
  const { data: clients = [] } = useQuery({
    queryKey: ['/api/clients'],
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
  });

  const hasActiveFilters = selectedClient || selectedEmployee || selectedCategory;

  return (
    <div className="flex items-center justify-between gap-4 mb-6 p-4 bg-card rounded-lg border">
      {/* Time Range Picker */}
      <TimeRangePicker selectedRange={timeRange} onRangeChange={onTimeRangeChange} />

      {/* Filters and Date Range */}
      <div className="flex items-center gap-3">
        {/* Date Range */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 min-w-[200px] justify-start text-left font-normal",
                !dateRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "MMM dd, y")
                )
              ) : (
                <span>Pick dates</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  onDateRangeChange({ from: range.from, to: range.to });
                }
              }}
              numberOfMonths={2}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        {/* Client Filter */}
        <Select value={selectedClient || "all-clients"} onValueChange={(value) => onClientChange(value === "all-clients" ? undefined : value)}>
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue placeholder="All Clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-clients">All Clients</SelectItem>
            {Array.isArray(clients) && clients.map((client: any) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Employee Filter */}
        <Select value={selectedEmployee || "all-employees"} onValueChange={(value) => onEmployeeChange(value === "all-employees" ? undefined : value)}>
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue placeholder="All Employees" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-employees">All Employees</SelectItem>
            {Array.isArray(employees) && employees.map((employee: any) => (
              <SelectItem key={employee.id} value={employee.id}>
                {employee.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category Filter */}
        <Select value={selectedCategory || "all-categories"} onValueChange={(value) => onCategoryChange(value === "all-categories" ? undefined : value)}>
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-categories">All Categories</SelectItem>
            {Array.isArray(categories) && categories.map((category: any) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="h-9 px-2">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}