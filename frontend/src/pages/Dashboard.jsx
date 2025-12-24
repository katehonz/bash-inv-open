import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Avatar,
  Stack,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  Description as InvoiceIcon,
  People as ClientIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Add as AddIcon,
  ArrowForward as ArrowForwardIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useCompany } from '../context/CompanyContext';
import { GET_DASHBOARD_STATS } from '../graphql/queries';

// Helper component for Summary Cards with Gradient
const SummaryCard = ({ title, value, icon, color1, color2, subtitle }) => (
  <Card
    sx={{
      height: '100%',
      background: `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`,
      color: 'white',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
      },
    }}
  >
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            width: 48,
            height: 48,
          }}
        >
          {icon}
        </Avatar>
        <Typography variant="h6" sx={{ ml: 2, fontWeight: 600 }}>
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        {value}
      </Typography>
      <Typography variant="body2" sx={{ opacity: 0.8 }}>
        {subtitle}
      </Typography>
      
      {/* Decorative Circle */}
      <Box
        sx={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 100,
          height: 100,
          borderRadius: '50%',
          bgcolor: 'rgba(255, 255, 255, 0.1)',
        }}
      />
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { activeCompanyId } = useCompany();
  
  const { data, loading, error } = useQuery(GET_DASHBOARD_STATS, {
    variables: { companyId: activeCompanyId },
    skip: !activeCompanyId,
    pollInterval: 60000, // Refresh every minute
  });

  const stats = data?.dashboardStats || {
    totalInvoices: 0,
    totalClients: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
    recentInvoices: [],
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'FINAL': return 'success';
      case 'DRAFT': return 'default';
      case 'CANCELLED': return 'error';
      default: return 'primary';
    }
  };

  if (loading && !data) return <LinearProgress />;

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            Табло
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Добре дошли обратно! Ето какво се случва с вашите финанси.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/documents/create')}
          size="large"
          sx={{ borderRadius: 2 }}
        >
          Нова фактура
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Приходи"
            value={`${stats.totalRevenue.toFixed(2)} лв.`}
            subtitle="Общо приходи за периода"
            icon={<MoneyIcon />}
            color1="#10b981" // Emerald
            color2="#059669"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Фактури"
            value={stats.totalInvoices}
            subtitle={`${stats.pendingInvoices} чакащи плащане`}
            icon={<InvoiceIcon />}
            color1="#3b82f6" // Blue
            color2="#2563eb"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Клиенти"
            value={stats.totalClients}
            subtitle="Активни контрагенти"
            icon={<ClientIcon />}
            color1="#8b5cf6" // Violet
            color2="#7c3aed"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Закъснели"
            value={stats.overduedInvoices}
            subtitle="Фактури с изтекъл срок"
            icon={<WarningIcon />}
            color1="#f59e0b" // Amber
            color2="#d97706"
          />
        </Grid>
      </Grid>

      {/* Recent Activity & Charts Area */}
      <Grid container spacing={3}>
        {/* Recent Invoices Table */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight="bold">
                Последни фактури
              </Typography>
              <Button
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/documents')}
                size="small"
              >
                Виж всички
              </Button>
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Номер</TableCell>
                    <TableCell>Клиент</TableCell>
                    <TableCell>Дата</TableCell>
                    <TableCell>Сума</TableCell>
                    <TableCell>Статус</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.recentInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                        Няма скорошни фактури
                      </TableCell>
                    </TableRow>
                  ) : (
                    stats.recentInvoices.map((invoice) => (
                      <TableRow
                        key={invoice.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/documents/${invoice.id}`)}
                      >
                        <TableCell sx={{ fontWeight: 500 }}>{invoice.documentNumber}</TableCell>
                        <TableCell>{invoice.clientName}</TableCell>
                        <TableCell>{new Date(invoice.issueDate).toLocaleDateString('bg-BG')}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {invoice.totalAmountWithVat.toFixed(2)} {invoice.currency}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={invoice.status === 'FINAL' ? 'ИЗДАДЕНА' : invoice.status === 'DRAFT' ? 'ЧЕРНОВА' : 'АНУЛИРАНА'}
                            color={getStatusColor(invoice.status)}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Quick Actions / Tips */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%', bgcolor: 'primary.main', color: 'white' }}>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon fontSize="large" />
                <Typography variant="h6" fontWeight="bold">
                  Бърз съвет
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Използвайте новата функция за <strong>UBL Експорт</strong>, за да изпращате електронни фактури директно към счетоводния софтуер на вашите клиенти.
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                sx={{ mt: 2, alignSelf: 'flex-start' }}
                onClick={() => navigate('/documents/create')}
              >
                Създай фактура сега
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
