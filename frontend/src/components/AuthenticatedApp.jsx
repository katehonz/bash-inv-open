import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import Dashboard from '../pages/Dashboard';
import Documents from '../pages/Documents';
import CreateInvoiceNew from '../pages/CreateInvoiceNew';
import DocumentDetail from '../pages/DocumentDetail';
import EditDocument from '../pages/EditDocument';
import Clients from '../pages/Clients';
import CreateClient from '../pages/CreateClient';
import ClientDetail from '../pages/ClientDetail';
import EditClient from '../pages/EditClient';
import Items from '../pages/Items';
import Reports from '../pages/Reports';
import CompanySettings from '../pages/CompanySettings';
import GlobalSettings from '../pages/GlobalSettings';
import SelectCompany from '../pages/SelectCompany';
import { CompanyProvider } from '../context/CompanyContext';

const AuthenticatedApp = () => {
  return (
    <CompanyProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/documents/create" element={<CreateInvoiceNew />} />
          <Route path="/documents/:id" element={<DocumentDetail />} />
          <Route path="/documents/:id/edit" element={<EditDocument />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/create" element={<CreateClient />} />
          <Route path="/clients/:id" element={<ClientDetail />} />
          <Route path="/clients/:id/edit" element={<EditClient />} />
          <Route path="/items" element={<Items />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/select-company" element={<SelectCompany />} />
          <Route path="/company" element={<CompanySettings />} />
          <Route path="/global-settings" element={<GlobalSettings />} />
        </Routes>
      </Layout>
    </CompanyProvider>
  );
};

export default AuthenticatedApp;