import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ClientDashboard = () => {
  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Client Dashboard</h1>
          <p className="text-muted-foreground">
            Client-specific financial overview and reports
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Client Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground">
              Client dashboard coming soon.
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ClientDashboard;