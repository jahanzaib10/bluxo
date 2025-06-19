import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import AddRecordModal from "@/components/modals/add-record-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatDate, formatCurrency } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Code, Search, Edit, Trash2, DollarSign } from "lucide-react";
import type { Developer } from "@shared/schema";

export default function Developers() {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: developers = [], isLoading } = useQuery<Developer[]>({
    queryKey: ["/api/developers"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/developers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/developers"] });
      toast({
        title: "Success",
        description: "Developer deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete developer: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const filteredDevelopers = developers.filter(developer =>
    developer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this developer?")) {
      deleteMutation.mutate(id);
    }
  };

  const getRateColor = (rate: string) => {
    const numRate = parseFloat(rate);
    if (numRate >= 100) return "text-success";
    if (numRate >= 50) return "text-warning";
    return "text-gray-600";
  };

  return (
    <>
      <Header 
        title="Developers" 
        subtitle="Manage developer resources and hourly rates"
      />

      <main className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search developers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <AddRecordModal />
        </div>

        <Card className="bg-surface shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Code className="mr-2 h-5 w-5" />
              All Developers ({filteredDevelopers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg animate-pulse">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredDevelopers.length > 0 ? (
              <div className="space-y-4">
                {filteredDevelopers.map((developer) => (
                  <div key={developer.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
                        <Code className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{developer.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <DollarSign className="h-3 w-3 mr-1" />
                            <span className={getRateColor(developer.hourly_rate)}>
                              {formatCurrency(parseFloat(developer.hourly_rate))}/hr
                            </span>
                          </span>
                          <span>Created: {formatDate(developer.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-primary bg-opacity-10 text-primary">
                        Active
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(developer.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Code className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No developers found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm ? "No developers match your search criteria." : "Get started by adding your first developer."}
                </p>
                {!searchTerm && <AddRecordModal />}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
