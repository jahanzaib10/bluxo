import React from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from './Layout';

const DashboardLayout: React.FC = () => {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default DashboardLayout;