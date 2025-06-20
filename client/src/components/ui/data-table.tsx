import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';

export interface DataTableColumn {
  key: string;
  label: string;
  minWidth?: string;
  render?: (item: any) => React.ReactNode;
  sortable?: boolean;
}

export interface DataTableAction {
  label: string;
  icon?: React.ReactNode;
  onClick: (item: any) => void;
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
}

interface DataTableProps {
  data: any[];
  columns: DataTableColumn[];
  actions?: DataTableAction[];
  height?: string;
  stickyActions?: boolean;
  configurableColumns?: boolean;
  storageKey?: string;
  showColumnConfig?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}

export function DataTable({
  data,
  columns,
  actions = [],
  height = 'auto',
  stickyActions = false,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...'
}: DataTableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const sortedData = useMemo(() => {
    if (!sortColumn) return data;
    
    return [...data].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortColumn, sortDirection]);

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      {onSearchChange && (
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="max-w-sm"
          />
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <ScrollArea style={{ height }} className="w-full">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead 
                    key={column.key}
                    style={{ minWidth: column.minWidth }}
                    className={column.sortable ? 'cursor-pointer hover:bg-muted/50' : ''}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.label}</span>
                      {column.sortable && sortColumn === column.key && (
                        <span className="text-xs">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
                {actions.length > 0 && (
                  <TableHead className={stickyActions ? 'sticky right-0 bg-background' : ''}>
                    Actions
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((item, index) => (
                <TableRow key={item.id || index}>
                  {columns.map((column) => (
                    <TableCell 
                      key={column.key}
                      style={{ minWidth: column.minWidth }}
                    >
                      {column.render ? column.render(item) : item[column.key]}
                    </TableCell>
                  ))}
                  {actions.length > 0 && (
                    <TableCell className={stickyActions ? 'sticky right-0 bg-background' : ''}>
                      <div className="flex items-center space-x-1">
                        {actions.map((action, actionIndex) => (
                          <Button
                            key={actionIndex}
                            variant={action.variant || 'outline'}
                            size="sm"
                            onClick={() => action.onClick(item)}
                            className={action.className}
                          >
                            {action.icon}
                            <span className="sr-only">{action.label}</span>
                          </Button>
                        ))}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {sortedData.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No data available
        </div>
      )}
    </div>
  );
}

export default DataTable;