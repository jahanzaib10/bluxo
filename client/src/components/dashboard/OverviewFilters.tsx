
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { HierarchicalSelect } from '@/components/ui/hierarchical-select';
import { TimeRangePicker } from './TimeRangePicker';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useHierarchicalCategories } from '@/hooks/useHierarchicalCategories';
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
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('archived', false)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('archived', false)
        .order('worker_full_name');
      if (error) throw error;
      return data;
    },
  });

  const { data: categories } = useHierarchicalCategories();

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
            {clients.map((client) => (
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
            {employees.map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>
                {employee.worker_full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category Filter */}
        <div className="w-[140px]">
          <HierarchicalSelect
            categories={categories || []}
            value={selectedCategory || "all-categories"}
            onValueChange={(value) => onCategoryChange(value === "all-categories" ? undefined : value)}
            placeholder="All Categories"
            showOnlyChildren={false}
          />
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="h-9"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
