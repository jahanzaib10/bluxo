
import React from 'react';
import { Dashboard as DashboardComponent } from '@/components/dashboard/Dashboard';

interface DashboardProps {
  tab: string;
}

const Dashboard = ({ tab }: DashboardProps) => {
  return <DashboardComponent initialTab={tab} />;
};

export default Dashboard;
