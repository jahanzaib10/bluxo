import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Building, 
  Tags, 
  Users, 
  Code, 
  IdCard, 
  BarChart3, 
  Database, 
  Settings,
  ChartLine
} from "lucide-react";

const mainNavItems = [
  { href: "/", label: "Dashboard", icon: BarChart3 },
  { href: "/accounts", label: "Accounts", icon: Building },
  { href: "/categories", label: "Categories", icon: Tags },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/developers", label: "Developers", icon: Code },
  { href: "/employees", label: "Employees", icon: IdCard },
];

const migrationNavItems = [
  { href: "/database-status", label: "Database Status", icon: Database },
  { href: "/api-endpoints", label: "API Endpoints", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-surface shadow-lg border-r border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-primary flex items-center">
          <ChartLine className="mr-3 h-6 w-6" />
          Finance Logger
        </h1>
        <p className="text-sm text-gray-600 mt-1">Replit Migration</p>
      </div>
      
      <nav className="mt-6">
        <div className="px-4 mb-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Main</span>
        </div>
        <ul className="space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            
            return (
              <li key={item.href}>
                <Link href={item.href}>
                  <a className={cn(
                    "flex items-center px-4 py-3 transition-colors",
                    isActive 
                      ? "text-primary bg-blue-50 border-r-2 border-primary" 
                      : "text-gray-700 hover:bg-gray-100"
                  )}>
                    <Icon className="mr-3 h-5 w-5" />
                    {item.label}
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
        
        <div className="px-4 mt-8 mb-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Migration</span>
        </div>
        <ul className="space-y-1">
          {migrationNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <li key={item.href}>
                <Link href={item.href}>
                  <a className={cn(
                    "flex items-center px-4 py-3 transition-colors",
                    isActive 
                      ? "text-primary bg-blue-50 border-r-2 border-primary" 
                      : "text-gray-700 hover:bg-gray-100"
                  )}>
                    <Icon className="mr-3 h-5 w-5" />
                    {item.label}
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
