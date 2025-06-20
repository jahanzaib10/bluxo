import { Card, CardContent } from "@/components/ui/card";

export default function ClientDashboard() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Client Dashboard</h1>
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">Client-specific dashboard coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}