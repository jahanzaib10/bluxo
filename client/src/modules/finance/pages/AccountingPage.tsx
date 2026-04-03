import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';

function formatCurrency(value: number): string {
  return `$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getDefaultDates(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setFullYear(start.getFullYear() - 1);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

interface PnLRow {
  categoryName: string;
  total: number;
}

interface PnLData {
  income: PnLRow[];
  expenses: PnLRow[];
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
}

interface TaxData {
  taxCollected: number;
  taxPaid: number;
  netTax: number;
}

export default function AccountingPage() {
  const defaults = getDefaultDates();
  const [pnlStart, setPnlStart] = useState(defaults.startDate);
  const [pnlEnd, setPnlEnd] = useState(defaults.endDate);
  const [taxStart, setTaxStart] = useState(defaults.startDate);
  const [taxEnd, setTaxEnd] = useState(defaults.endDate);

  // Committed query keys — only update when Apply is clicked
  const [pnlParams, setPnlParams] = useState({ startDate: defaults.startDate, endDate: defaults.endDate });
  const [taxParams, setTaxParams] = useState({ startDate: defaults.startDate, endDate: defaults.endDate });

  const { data: pnlData, isLoading: pnlLoading } = useQuery<PnLData>({
    queryKey: ['/api/accounting/pnl', pnlParams],
  });

  const { data: taxData, isLoading: taxLoading } = useQuery<TaxData>({
    queryKey: ['/api/accounting/tax-summary', taxParams],
  });

  const pnl = pnlData as PnLData | undefined;
  const tax = taxData as TaxData | undefined;

  const netProfitPositive = (pnl?.netProfit ?? 0) >= 0;
  const netTaxPositive = (tax?.netTax ?? 0) >= 0;

  return (
    <div className="h-screen overflow-y-auto bg-gray-50">
      <div className="max-w-5xl mx-auto p-4 space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounting</h1>
          <p className="text-sm text-gray-600">Profit & Loss and Tax Summary reports</p>
        </div>

        <Tabs defaultValue="pnl">
          <TabsList>
            <TabsTrigger value="pnl">Profit & Loss</TabsTrigger>
            <TabsTrigger value="tax">Tax Summary</TabsTrigger>
          </TabsList>

          {/* ── Profit & Loss Tab ── */}
          <TabsContent value="pnl" className="space-y-4 mt-4">
            {/* Date filters */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-700">Start Date</label>
                    <Input
                      type="date"
                      value={pnlStart}
                      onChange={(e) => setPnlStart(e.target.value)}
                      className="h-8 text-sm w-40"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-700">End Date</label>
                    <Input
                      type="date"
                      value={pnlEnd}
                      onChange={(e) => setPnlEnd(e.target.value)}
                      className="h-8 text-sm w-40"
                    />
                  </div>
                  <Button
                    size="sm"
                    className="h-8 bg-purple-600 hover:bg-purple-700"
                    onClick={() => setPnlParams({ startDate: pnlStart, endDate: pnlEnd })}
                  >
                    Apply
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="relative overflow-hidden border-0 shadow-sm">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-green-600" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                  <CardTitle className="text-xs font-medium text-gray-600">Total Income</CardTitle>
                  <div className="p-1.5 bg-green-100 rounded-md">
                    <ArrowUpRight className="h-3 w-3 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent className="pt-1">
                  {pnlLoading ? (
                    <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    <div className="text-xl font-bold text-gray-900">
                      {formatCurrency(pnl?.totalIncome ?? 0)}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-sm">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-400 to-red-600" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                  <CardTitle className="text-xs font-medium text-gray-600">Total Expenses</CardTitle>
                  <div className="p-1.5 bg-red-100 rounded-md">
                    <ArrowDownRight className="h-3 w-3 text-red-600" />
                  </div>
                </CardHeader>
                <CardContent className="pt-1">
                  {pnlLoading ? (
                    <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    <div className="text-xl font-bold text-gray-900">
                      {formatCurrency(pnl?.totalExpenses ?? 0)}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-sm">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-600" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                  <CardTitle className="text-xs font-medium text-gray-600">Net Profit</CardTitle>
                  <div className="p-1.5 bg-blue-100 rounded-md">
                    <DollarSign className="h-3 w-3 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent className="pt-1">
                  {pnlLoading ? (
                    <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    <div className={`text-xl font-bold ${netProfitPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(pnl?.netProfit ?? 0)}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Income - Expenses</p>
                </CardContent>
              </Card>
            </div>

            {/* P&L Table */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Breakdown by Category</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                {pnlLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="h-8 text-xs font-semibold">Category</TableHead>
                        <TableHead className="h-8 text-xs font-semibold text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Income section */}
                      <TableRow className="bg-green-50">
                        <TableCell
                          colSpan={2}
                          className="text-xs font-bold text-green-800 py-2 uppercase tracking-wide"
                        >
                          Income
                        </TableCell>
                      </TableRow>
                      {(pnl?.income ?? []).length > 0 ? (
                        (pnl?.income ?? []).map((row) => (
                          <TableRow key={row.categoryName} className="hover:bg-gray-50">
                            <TableCell className="text-sm py-2 pl-6">{row.categoryName}</TableCell>
                            <TableCell className="text-sm font-medium text-green-700 py-2 text-right">
                              {formatCurrency(row.total)}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} className="text-xs text-gray-400 py-3 text-center pl-6">
                            No income data
                          </TableCell>
                        </TableRow>
                      )}
                      {/* Income subtotal */}
                      <TableRow className="bg-green-50 border-t border-green-200">
                        <TableCell className="text-xs font-bold text-green-800 py-2 pl-6">
                          Total Income
                        </TableCell>
                        <TableCell className="text-sm font-bold text-green-700 py-2 text-right">
                          {formatCurrency(pnl?.totalIncome ?? 0)}
                        </TableCell>
                      </TableRow>

                      {/* Spacer */}
                      <TableRow>
                        <TableCell colSpan={2} className="py-1 bg-gray-50" />
                      </TableRow>

                      {/* Expenses section */}
                      <TableRow className="bg-red-50">
                        <TableCell
                          colSpan={2}
                          className="text-xs font-bold text-red-800 py-2 uppercase tracking-wide"
                        >
                          Expenses
                        </TableCell>
                      </TableRow>
                      {(pnl?.expenses ?? []).length > 0 ? (
                        (pnl?.expenses ?? []).map((row) => (
                          <TableRow key={row.categoryName} className="hover:bg-gray-50">
                            <TableCell className="text-sm py-2 pl-6">{row.categoryName}</TableCell>
                            <TableCell className="text-sm font-medium text-red-700 py-2 text-right">
                              {formatCurrency(row.total)}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} className="text-xs text-gray-400 py-3 text-center pl-6">
                            No expense data
                          </TableCell>
                        </TableRow>
                      )}
                      {/* Expenses subtotal */}
                      <TableRow className="bg-red-50 border-t border-red-200">
                        <TableCell className="text-xs font-bold text-red-800 py-2 pl-6">
                          Total Expenses
                        </TableCell>
                        <TableCell className="text-sm font-bold text-red-700 py-2 text-right">
                          {formatCurrency(pnl?.totalExpenses ?? 0)}
                        </TableCell>
                      </TableRow>

                      {/* Net Profit row */}
                      <TableRow className="bg-blue-50 border-t-2 border-blue-200">
                        <TableCell className="text-sm font-bold text-blue-800 py-3">
                          Net Profit
                        </TableCell>
                        <TableCell
                          className={`text-sm font-bold py-3 text-right ${
                            netProfitPositive ? 'text-green-700' : 'text-red-700'
                          }`}
                        >
                          {formatCurrency(pnl?.netProfit ?? 0)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tax Summary Tab ── */}
          <TabsContent value="tax" className="space-y-4 mt-4">
            {/* Date filters */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-700">Start Date</label>
                    <Input
                      type="date"
                      value={taxStart}
                      onChange={(e) => setTaxStart(e.target.value)}
                      className="h-8 text-sm w-40"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-700">End Date</label>
                    <Input
                      type="date"
                      value={taxEnd}
                      onChange={(e) => setTaxEnd(e.target.value)}
                      className="h-8 text-sm w-40"
                    />
                  </div>
                  <Button
                    size="sm"
                    className="h-8 bg-purple-600 hover:bg-purple-700"
                    onClick={() => setTaxParams({ startDate: taxStart, endDate: taxEnd })}
                  >
                    Apply
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tax Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="relative overflow-hidden border-0 shadow-sm">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-green-600" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                  <CardTitle className="text-xs font-medium text-gray-600">Tax Collected</CardTitle>
                  <div className="p-1.5 bg-green-100 rounded-md">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent className="pt-1">
                  {taxLoading ? (
                    <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    <div className="text-xl font-bold text-gray-900">
                      {formatCurrency(tax?.taxCollected ?? 0)}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">From income</p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-sm">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-orange-600" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                  <CardTitle className="text-xs font-medium text-gray-600">Tax Paid</CardTitle>
                  <div className="p-1.5 bg-orange-100 rounded-md">
                    <TrendingDown className="h-3 w-3 text-orange-600" />
                  </div>
                </CardHeader>
                <CardContent className="pt-1">
                  {taxLoading ? (
                    <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    <div className="text-xl font-bold text-gray-900">
                      {formatCurrency(tax?.taxPaid ?? 0)}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">On expenses</p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-sm">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-purple-600" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                  <CardTitle className="text-xs font-medium text-gray-600">Net Tax</CardTitle>
                  <div className="p-1.5 bg-purple-100 rounded-md">
                    <DollarSign className="h-3 w-3 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent className="pt-1">
                  {taxLoading ? (
                    <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    <div className={`text-xl font-bold ${netTaxPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(tax?.netTax ?? 0)}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Collected - Paid</p>
                </CardContent>
              </Card>
            </div>

            {/* Tax detail table */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Tax Overview</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                {taxLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="h-8 text-xs font-semibold">Item</TableHead>
                        <TableHead className="h-8 text-xs font-semibold text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="hover:bg-gray-50">
                        <TableCell className="text-sm py-2">Tax Collected (from income)</TableCell>
                        <TableCell className="text-sm font-medium text-green-700 py-2 text-right">
                          {formatCurrency(tax?.taxCollected ?? 0)}
                        </TableCell>
                      </TableRow>
                      <TableRow className="hover:bg-gray-50">
                        <TableCell className="text-sm py-2">Tax Paid (on expenses)</TableCell>
                        <TableCell className="text-sm font-medium text-orange-700 py-2 text-right">
                          {formatCurrency(tax?.taxPaid ?? 0)}
                        </TableCell>
                      </TableRow>
                      <TableRow className="bg-purple-50 border-t-2 border-purple-200">
                        <TableCell className="text-sm font-bold text-purple-800 py-3">
                          Net Tax Position
                        </TableCell>
                        <TableCell
                          className={`text-sm font-bold py-3 text-right ${
                            netTaxPositive ? 'text-green-700' : 'text-red-700'
                          }`}
                        >
                          {formatCurrency(tax?.netTax ?? 0)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
