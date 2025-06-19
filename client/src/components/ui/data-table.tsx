
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Settings, Search } from "lucide-react";

export interface DataTableColumn<T = any> {
  key: string;
  label: string;
  minWidth?: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

export interface DataTableAction<T = any> {
  label: string;
  icon: React.ReactNode;
  onClick: (item: T) => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export interface DataTableProps<T = any> {
  data: T[];
  columns: DataTableColumn<T>[];
  actions?: DataTableAction<T>[];
  onRowClick?: (item: T) => void;
  className?: string;
  height?: string;
  stickyActions?: boolean;
  configurableColumns?: boolean;
  storageKey?: string;
  showColumnConfig?: boolean;
  configureColumnsComponent?: React.ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  actions = [],
  onRowClick,
  className = "",
  height = "70vh",
  stickyActions = true,
  configurableColumns = true,
  storageKey,
  showColumnConfig = true,
  configureColumnsComponent,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search..."
}: DataTableProps<T>) {
  // Column visibility state - all columns visible by default
  const [visibleColumns, setVisibleColumns] = React.useState<Record<string, boolean>>(() => {
    const defaultVisibility = columns.reduce((acc, col) => {
      acc[col.key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    return defaultVisibility;
  });

  // Load column preferences from localStorage
  React.useEffect(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setVisibleColumns(JSON.parse(saved));
      }
    }
  }, [storageKey]);

  // Save column preferences to localStorage
  React.useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(visibleColumns));
    }
  }, [visibleColumns, storageKey]);

  const handleColumnToggle = (column: string, checked: boolean) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: checked
    }));
  };

  const visibleColumnsArray = columns.filter(col => visibleColumns[col.key]);

  const ColumnConfigComponent = configureColumnsComponent || (
    configurableColumns && showColumnConfig && (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="end">
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Toggle columns</h4>
            <div className="space-y-2">
              {columns.map((column) => (
                <div key={column.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={column.key}
                    checked={visibleColumns[column.key]}
                    onCheckedChange={(checked) => handleColumnToggle(column.key, checked as boolean)}
                  />
                  <label htmlFor={column.key} className="text-sm font-normal">
                    {column.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    )
  );

  return (
    <div className={`w-full ${className}`}>
      {/* Search bar */}
      {onSearchChange && (
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue || ""}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      )}
      
      <div className="border rounded-md overflow-hidden">
        <div className={`overflow-auto relative`} style={{ height }}>
          <Table>
            <TableHeader>
              <TableRow>
                {visibleColumnsArray.map((column) => (
                  <TableHead
                    key={column.key}
                    className={`whitespace-nowrap ${column.minWidth ? `min-w-[${column.minWidth}]` : ''} ${column.className || ''}`}
                  >
                    {column.label}
                  </TableHead>
                ))}
                {actions.length > 0 && (
                  <TableHead className={`text-right min-w-[120px] whitespace-nowrap ${stickyActions ? 'sticky right-0 bg-background border-l' : ''}`}>
                    Actions
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, index) => (
                <TableRow 
                  key={item.id || index}
                  className={`transition-all duration-200 ${onRowClick ? 'cursor-pointer hover:bg-muted/70' : ''}`}
                  onClick={() => onRowClick?.(item)}
                >
                  {visibleColumnsArray.map((column) => (
                    <TableCell
                      key={column.key}
                      className={`${column.minWidth ? `min-w-[${column.minWidth}]` : ''} ${column.className || ''}`}
                    >
                      {column.render ? column.render(item) : (item[column.key] || '-')}
                    </TableCell>
                  ))}
                  {actions.length > 0 && (
                    <TableCell className={`text-right min-w-[120px] ${stickyActions ? 'sticky right-0 bg-background border-l' : ''}`}>
                      <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                        {actions.map((action, actionIndex) => (
                          <Button
                            key={actionIndex}
                            size="sm"
                            variant={action.variant || "outline"}
                            onClick={() => action.onClick(item)}
                          >
                            {action.icon}
                          </Button>
                        ))}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Render column config component if provided or show default */}
      {ColumnConfigComponent && (
        <div className="mt-4 flex justify-end">
          {ColumnConfigComponent}
        </div>
      )}
    </div>
  );
}
