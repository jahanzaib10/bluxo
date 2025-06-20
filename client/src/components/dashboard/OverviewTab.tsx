import React, { useState } from 'react';
import { OverviewFilters } from './OverviewFilters';
import { ModernOverviewChart } from './ModernOverviewChart';
import { subMonths } from 'date-fns';

export function OverviewTab() {
  const [selectedClient, setSelectedClient] = useState<string | undefined>();
  const [selectedEmployee, setSelectedEmployee] = useState<string | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [timeRange, setTimeRange] = useState<string>('month');
  
  // Date range state with default to last 3 months
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subMonths(new Date(), 3),
    to: new Date()
  });

  const handleClearFilters = () => {
    setSelectedClient(undefined);
    setSelectedEmployee(undefined);
    setSelectedCategory(undefined);
    setDateRange({
      from: subMonths(new Date(), 3),
      to: new Date()
    });
  };

  return (
    <div className="space-y-6">
      {/* Compact Filters */}
      <OverviewFilters
        selectedClient={selectedClient}
        selectedEmployee={selectedEmployee}
        selectedCategory={selectedCategory}
        dateRange={dateRange}
        timeRange={timeRange}
        onClientChange={setSelectedClient}
        onEmployeeChange={setSelectedEmployee}
        onCategoryChange={setSelectedCategory}
        onDateRangeChange={setDateRange}
        onTimeRangeChange={setTimeRange}
        onClearFilters={handleClearFilters}
      />

      {/* Enhanced Chart with Analytics */}
      <ModernOverviewChart
        selectedClient={selectedClient}
        selectedEmployee={selectedEmployee}
        selectedCategory={selectedCategory}
        dateRange={dateRange}
        timeRange={timeRange}
      />
    </div>
  );
}