import { Button } from "@/components/ui/button";
import { Plus, User } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle: string;
  onAddNew?: () => void;
}

export default function Header({ title, subtitle, onAddNew }: HeaderProps) {
  return (
    <header className="bg-surface border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-600">{subtitle}</p>
        </div>
        <div className="flex items-center space-x-4">
          {onAddNew && (
            <Button onClick={onAddNew} className="bg-primary hover:bg-primary-dark">
              <Plus className="mr-2 h-4 w-4" />
              Add New
            </Button>
          )}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700">Admin User</span>
          </div>
        </div>
      </div>
    </header>
  );
}
