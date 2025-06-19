import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import StatusCard from "@/components/dashboard/status-card";
import AddRecordModal from "@/components/modals/add-record-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getRelativeTime } from "@/lib/utils";
import { 
  CheckCircle, 
  Table, 
  Plug, 
  Database, 
  Building, 
  Leaf, 
  Rocket,
  Building2,
  Tags,
  Users,
  Code,
  IdCard,
  FlaskRound
} from "lucide-react";
import type { Account } from "@shared/schema";

export default function Dashboard() {
  const { data: accounts = [], isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const recentAccounts = accounts.slice(0, 3);

  const tableSchemas = [
    { name: "accounts", icon: Building2, columns: 7, status: "Active" },
    { name: "categories", icon: Tags, columns: 6, status: "Active" },
    { name: "clients", icon: Users, columns: 6, status: "Active" },
    { name: "developers", icon: Code, columns: 6, status: "Active" },
    { name: "employees", icon: IdCard, columns: 10, status: "Active" },
  ];

  const apiEndpoints = [
    { path: "/api/accounts", method: "GET", status: "Active", responseTime: "42ms", statusColor: "success" },
    { path: "/api/accounts", method: "POST", status: "Active", responseTime: "85ms", statusColor: "success" },
    { path: "/api/categories", method: "GET", status: "Testing", responseTime: "--", statusColor: "warning" },
    { path: "/api/developers", method: "DELETE", status: "Active", responseTime: "23ms", statusColor: "success" },
  ];

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET": return "bg-green-100 text-green-800";
      case "POST": return "bg-blue-100 text-blue-800";
      case "PUT": return "bg-yellow-100 text-yellow-800";
      case "DELETE": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getAccountIcon = (index: number) => {
    const icons = [Building, Leaf, Rocket];
    return icons[index % icons.length];
  };

  return (
    <>
      <Header 
        title="Dashboard" 
        subtitle="Monitor your finance data migration from Supabase to Replit"
        onAddNew={() => {}}
      />

      <main className="flex-1 overflow-auto p-6">
        {/* Migration Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatusCard
            title="Database Status"
            value="Connected"
            icon={CheckCircle}
            status="success"
            subtitle="Replit Postgres Active"
          />
          <StatusCard
            title="Tables Migrated"
            value="5/5"
            icon={Table}
            status="success"
            subtitle="All tables created"
          />
          <StatusCard
            title="API Endpoints"
            value="25"
            icon={Plug}
            status="success"
            subtitle="CRUD operations ready"
          />
          <StatusCard
            title="Data Records"
            value={accounts.length.toLocaleString()}
            icon={Database}
            status="neutral"
            subtitle="Records available"
          />
        </div>

        {/* Tables Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Accounts */}
          <Card className="bg-surface shadow-sm border border-gray-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium text-gray-900">Recent Accounts</CardTitle>
                <Button variant="link" className="text-primary hover:text-primary-dark text-sm font-medium p-0">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {accountsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between animate-pulse">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                        <div className="ml-3">
                          <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                          <div className="h-3 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                      <div className="h-3 bg-gray-200 rounded w-12"></div>
                    </div>
                  ))}
                </div>
              ) : recentAccounts.length > 0 ? (
                <div className="space-y-4">
                  {recentAccounts.map((account, index) => {
                    const Icon = getAccountIcon(index);
                    const colors = ["bg-primary bg-opacity-10 text-primary", "bg-success bg-opacity-10 text-success", "bg-warning bg-opacity-10 text-warning"];
                    
                    return (
                      <div key={account.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 ${colors[index]} rounded-lg flex items-center justify-center`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{account.company_name}</p>
                            <p className="text-xs text-gray-500">{account.currency}</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">{getRelativeTime(account.created_at)}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No accounts found</p>
                  <AddRecordModal>
                    <Button variant="link" className="text-primary">
                      Create your first account
                    </Button>
                  </AddRecordModal>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Database Schema */}
          <Card className="bg-surface shadow-sm border border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium text-gray-900">Database Schema</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {tableSchemas.map((table) => {
                  const Icon = table.icon;
                  return (
                    <div key={table.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <Icon className="h-5 w-5 text-primary mr-3" />
                        <span className="text-sm font-medium">{table.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="bg-success text-white">
                          {table.status}
                        </Badge>
                        <span className="text-xs text-gray-500">{table.columns} columns</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* API Endpoints Table */}
        <div className="mt-8">
          <Card className="bg-surface shadow-sm border border-gray-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium text-gray-900">API Endpoints Status</CardTitle>
                <Button className="bg-primary hover:bg-primary-dark text-sm">
                  <FlaskRound className="mr-2 h-4 w-4" />
                  Test All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Endpoint</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {apiEndpoints.map((endpoint, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{endpoint.path}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getMethodColor(endpoint.method)}>
                            {endpoint.method}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge 
                            variant="secondary" 
                            className={
                              endpoint.statusColor === "success" 
                                ? "bg-success bg-opacity-10 text-success"
                                : "bg-warning bg-opacity-10 text-warning"
                            }
                          >
                            <CheckCircle className="mr-1 h-3 w-3" />
                            {endpoint.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{endpoint.responseTime}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button variant="link" className="text-primary hover:text-primary-dark p-0 mr-4">Test</Button>
                          <Button variant="link" className="text-gray-600 hover:text-gray-900 p-0">Logs</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
