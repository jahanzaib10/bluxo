import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';

const PaymentSources = () => {
  const { data: paymentSources, isLoading } = useQuery({
    queryKey: ['/api/payment-sources']
  });

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payment Sources</h1>
            <p className="text-muted-foreground">
              Manage bank accounts, cards, and payment methods
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Payment Source
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded"></div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                No payment sources found. Click "Add Payment Source" to get started.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PaymentSources;