import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  MenuItem,
  Stack,
  LinearProgress,
  Grid,
  Autocomplete,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
} from '@mui/material';
import {
  FileDownload as ExcelIcon,
  Print as PrintIcon,
  FilterAlt as FilterIcon,
  Clear as ClearIcon,
  Description as DocumentIcon,
  Inventory as ItemIcon,
} from '@mui/icons-material';
import { useQuery } from '@apollo/client';
import { GET_DOCUMENTS_FOR_REPORTS, GET_CLIENTS, GET_ITEMS_BY_COMPANY } from '../graphql/queries';
import { DocumentType } from '../types';
import * as XLSX from 'xlsx';
import { useCompany } from '../context/CompanyContext';

// Tab Panel component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const Reports = () => {
  const { activeCompanyId } = useCompany();
  const [activeTab, setActiveTab] = useState(0);

  // Document filters
  const [docFilters, setDocFilters] = useState({
    clientId: null,
    paymentStatus: 'ALL',
    dateFrom: '',
    dateTo: '',
    documentType: 'ALL',
  });

  // Item filters
  const [itemFilters, setItemFilters] = useState({
    itemId: null,
    clientId: null,
    dateFrom: '',
    dateTo: '',
  });

  // Queries
  const { data: documentsData, loading: documentsLoading } = useQuery(GET_DOCUMENTS_FOR_REPORTS, {
    variables: { companyId: activeCompanyId },
  });

  const { data: clientsData } = useQuery(GET_CLIENTS, {
    variables: { companyId: activeCompanyId },
  });

  const { data: itemsData } = useQuery(GET_ITEMS_BY_COMPANY, {
    variables: { companyId: activeCompanyId },
  });

  const documents = documentsData?.documentsByCompany || [];
  const clients = clientsData?.clientsByCompany || [];
  const items = itemsData?.itemsByCompany || [];

  // ============= DOCUMENTS TAB =============

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Изключваме анулирани документи от справките
      if (doc.status === 'CANCELLED') return false;
      if (docFilters.clientId && doc.client.id !== docFilters.clientId) return false;
      if (docFilters.paymentStatus === 'PAID' && !doc.isPaid) return false;
      if (docFilters.paymentStatus === 'UNPAID' && doc.isPaid) return false;
      if (docFilters.dateFrom) {
        const docDate = new Date(doc.issueDate);
        const fromDate = new Date(docFilters.dateFrom);
        if (docDate < fromDate) return false;
      }
      if (docFilters.dateTo) {
        const docDate = new Date(doc.issueDate);
        const toDate = new Date(docFilters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (docDate > toDate) return false;
      }
      if (docFilters.documentType !== 'ALL' && doc.documentType !== docFilters.documentType) return false;
      return true;
    });
  }, [documents, docFilters]);

  const docTotals = useMemo(() => {
    return filteredDocuments.reduce(
      (acc, doc) => {
        acc.totalAmount += doc.totalAmountWithVat || 0;
        if (doc.isPaid) acc.paidAmount += doc.totalAmountWithVat || 0;
        else acc.unpaidAmount += doc.totalAmountWithVat || 0;
        acc.count += 1;
        return acc;
      },
      { totalAmount: 0, paidAmount: 0, unpaidAmount: 0, count: 0 }
    );
  }, [filteredDocuments]);

  // ============= ITEMS TAB =============

  // Build item sales data from documents
  const itemSalesData = useMemo(() => {
    const itemMap = new Map();

    documents.forEach((doc) => {
      // Изключваме анулирани документи
      if (doc.status === 'CANCELLED') return;
      // Apply date filters
      if (itemFilters.dateFrom) {
        const docDate = new Date(doc.issueDate);
        const fromDate = new Date(itemFilters.dateFrom);
        if (docDate < fromDate) return;
      }
      if (itemFilters.dateTo) {
        const docDate = new Date(doc.issueDate);
        const toDate = new Date(itemFilters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (docDate > toDate) return;
      }
      // Apply client filter
      if (itemFilters.clientId && doc.client.id !== itemFilters.clientId) return;

      doc.documentItems?.forEach((di) => {
        if (!di.item) return;
        // Apply item filter
        if (itemFilters.itemId && di.item.id !== itemFilters.itemId) return;

        const key = di.item.id;
        if (!itemMap.has(key)) {
          itemMap.set(key, {
            itemId: di.item.id,
            itemNumber: di.item.itemNumber,
            itemName: di.item.name,
            totalQuantity: 0,
            totalAmount: 0,
            documentCount: 0,
            documents: new Set(),
          });
        }
        const entry = itemMap.get(key);
        entry.totalQuantity += di.quantity || 0;
        entry.totalAmount += di.lineTotal || 0;
        entry.documents.add(doc.id);
      });
    });

    // Convert to array and calculate document count
    return Array.from(itemMap.values())
      .map((item) => ({
        ...item,
        documentCount: item.documents.size,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }, [documents, itemFilters]);

  const itemTotals = useMemo(() => {
    return itemSalesData.reduce(
      (acc, item) => {
        acc.totalQuantity += item.totalQuantity;
        acc.totalAmount += item.totalAmount;
        return acc;
      },
      { totalQuantity: 0, totalAmount: 0 }
    );
  }, [itemSalesData]);

  // ============= HELPERS =============

  const getTypeLabel = (type) => {
    switch (type) {
      case DocumentType.INVOICE: return 'Фактура';
      case DocumentType.CREDIT_NOTE: return 'Кредитно известие';
      case DocumentType.DEBIT_NOTE: return 'Дебитно известие';
      case DocumentType.PROFORMA: return 'Проформа';
      default: return type;
    }
  };

  const getPaidLabel = (doc) => {
    if (doc.isPaid) {
      const methodCode = doc.paymentMethod?.methodCode;
      if (methodCode === 'CASH') return 'В брой';
      if (methodCode === 'CARD') return 'С карта';
      if (doc.paidAt) return `Платено ${new Date(doc.paidAt).toLocaleDateString('bg-BG')}`;
      return 'Платено';
    }
    return 'Неплатено';
  };

  const clearDocFilters = () => {
    setDocFilters({
      clientId: null,
      paymentStatus: 'ALL',
      dateFrom: '',
      dateTo: '',
      documentType: 'ALL',
    });
  };

  const clearItemFilters = () => {
    setItemFilters({
      itemId: null,
      clientId: null,
      dateFrom: '',
      dateTo: '',
    });
  };

  // ============= EXPORT FUNCTIONS =============

  const exportDocumentsToExcel = () => {
    const exportData = filteredDocuments.map((doc, index) => ({
      '№': index + 1,
      'Номер': doc.fullDocumentNumber,
      'Тип': getTypeLabel(doc.documentType),
      'Клиент': doc.client.name,
      'Дата': new Date(doc.issueDate).toLocaleDateString('bg-BG'),
      'Срок': new Date(doc.dueDate).toLocaleDateString('bg-BG'),
      'Сума': doc.totalAmountWithVat.toFixed(2),
      'Статус': doc.status === 'FINAL' ? 'Приключен' : 'Чернова',
      'Плащане': getPaidLabel(doc),
    }));

    exportData.push({
      '№': '', 'Номер': '', 'Тип': '', 'Клиент': 'ОБЩО:',
      'Дата': `${docTotals.count} документа`, 'Срок': '',
      'Сума': docTotals.totalAmount.toFixed(2), 'Статус': '',
      'Плащане': `Платено: ${docTotals.paidAmount.toFixed(2)} / Неплатено: ${docTotals.unpaidAmount.toFixed(2)}`,
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Документи');
    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Справка_Документи_${today}.xlsx`);
  };

  const exportItemsToExcel = () => {
    const exportData = itemSalesData.map((item, index) => ({
      '№': index + 1,
      'Код': item.itemNumber,
      'Артикул': item.itemName,
      'Количество': item.totalQuantity,
      'Сума': item.totalAmount.toFixed(2),
      'Брой документи': item.documentCount,
    }));

    exportData.push({
      '№': '', 'Код': '', 'Артикул': 'ОБЩО:',
      'Количество': itemTotals.totalQuantity,
      'Сума': itemTotals.totalAmount.toFixed(2),
      'Брой документи': '',
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Артикули');
    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Справка_Артикули_${today}.xlsx`);
  };

  // ============= PRINT FUNCTIONS =============

  const printDocuments = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Справка документи</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
          h1 { text-align: center; margin-bottom: 10px; }
          .filters { margin-bottom: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #1976d2; color: white; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .totals { margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 4px; }
          .totals-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
          .totals-item { text-align: center; }
          .totals-label { font-size: 11px; color: #666; }
          .totals-value { font-size: 18px; font-weight: bold; color: #1976d2; }
          .paid { color: #2e7d32; }
          .unpaid { color: #d32f2f; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .print-date { text-align: right; font-size: 10px; color: #666; margin-bottom: 10px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="print-date">Отпечатано на: ${new Date().toLocaleString('bg-BG')}</div>
        <h1>Справка документи</h1>
        <div class="filters">
          <strong>Филтри:</strong>
          ${docFilters.clientId ? `Клиент: ${clients.find(c => c.id === docFilters.clientId)?.name || ''}; ` : ''}
          ${docFilters.paymentStatus !== 'ALL' ? `Плащане: ${docFilters.paymentStatus === 'PAID' ? 'Платени' : 'Неплатени'}; ` : ''}
          ${docFilters.dateFrom ? `От: ${new Date(docFilters.dateFrom).toLocaleDateString('bg-BG')}; ` : ''}
          ${docFilters.dateTo ? `До: ${new Date(docFilters.dateTo).toLocaleDateString('bg-BG')}; ` : ''}
          ${docFilters.documentType !== 'ALL' ? `Тип: ${getTypeLabel(docFilters.documentType)}; ` : ''}
          ${!docFilters.clientId && docFilters.paymentStatus === 'ALL' && !docFilters.dateFrom && !docFilters.dateTo && docFilters.documentType === 'ALL' ? 'Няма приложени филтри' : ''}
        </div>
        <table>
          <thead>
            <tr>
              <th>№</th><th>Номер</th><th>Тип</th><th>Клиент</th><th>Дата</th>
              <th>Срок</th><th class="text-right">Сума</th><th class="text-center">Статус</th><th>Плащане</th>
            </tr>
          </thead>
          <tbody>
            ${filteredDocuments.map((doc, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${doc.fullDocumentNumber}</td>
                <td>${getTypeLabel(doc.documentType)}</td>
                <td>${doc.client.name}</td>
                <td>${new Date(doc.issueDate).toLocaleDateString('bg-BG')}</td>
                <td>${new Date(doc.dueDate).toLocaleDateString('bg-BG')}</td>
                <td class="text-right">${doc.totalAmountWithVat.toFixed(2)} лв.</td>
                <td class="text-center">${doc.status === 'FINAL' ? 'Приключен' : 'Чернова'}</td>
                <td class="${doc.isPaid ? 'paid' : 'unpaid'}">${getPaidLabel(doc)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="totals">
          <div class="totals-grid">
            <div class="totals-item">
              <div class="totals-label">Общо документи</div>
              <div class="totals-value">${docTotals.count}</div>
            </div>
            <div class="totals-item">
              <div class="totals-label">Обща сума</div>
              <div class="totals-value">${docTotals.totalAmount.toFixed(2)} лв.</div>
            </div>
            <div class="totals-item">
              <div class="totals-label">Платено</div>
              <div class="totals-value paid">${docTotals.paidAmount.toFixed(2)} лв.</div>
            </div>
            <div class="totals-item">
              <div class="totals-label">Неплатено</div>
              <div class="totals-value unpaid">${docTotals.unpaidAmount.toFixed(2)} лв.</div>
            </div>
          </div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const printItems = () => {
    const selectedItem = items.find((i) => i.id === itemFilters.itemId);
    const selectedClient = clients.find((c) => c.id === itemFilters.clientId);

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Справка артикули</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
          h1 { text-align: center; margin-bottom: 10px; }
          .filters { margin-bottom: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #1976d2; color: white; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .totals { margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 4px; }
          .totals-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
          .totals-item { text-align: center; }
          .totals-label { font-size: 11px; color: #666; }
          .totals-value { font-size: 18px; font-weight: bold; color: #1976d2; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .print-date { text-align: right; font-size: 10px; color: #666; margin-bottom: 10px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="print-date">Отпечатано на: ${new Date().toLocaleString('bg-BG')}</div>
        <h1>Справка артикули</h1>
        <div class="filters">
          <strong>Филтри:</strong>
          ${itemFilters.itemId ? `Артикул: ${selectedItem?.name || ''}; ` : ''}
          ${itemFilters.clientId ? `Клиент: ${selectedClient?.name || ''}; ` : ''}
          ${itemFilters.dateFrom ? `От: ${new Date(itemFilters.dateFrom).toLocaleDateString('bg-BG')}; ` : ''}
          ${itemFilters.dateTo ? `До: ${new Date(itemFilters.dateTo).toLocaleDateString('bg-BG')}; ` : ''}
          ${!itemFilters.itemId && !itemFilters.clientId && !itemFilters.dateFrom && !itemFilters.dateTo ? 'Няма приложени филтри' : ''}
        </div>
        <table>
          <thead>
            <tr>
              <th>№</th><th>Код</th><th>Артикул</th>
              <th class="text-right">Количество</th><th class="text-right">Сума</th><th class="text-center">Брой документи</th>
            </tr>
          </thead>
          <tbody>
            ${itemSalesData.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.itemNumber}</td>
                <td>${item.itemName}</td>
                <td class="text-right">${item.totalQuantity}</td>
                <td class="text-right">${item.totalAmount.toFixed(2)} лв.</td>
                <td class="text-center">${item.documentCount}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="totals">
          <div class="totals-grid">
            <div class="totals-item">
              <div class="totals-label">Брой артикули</div>
              <div class="totals-value">${itemSalesData.length}</div>
            </div>
            <div class="totals-item">
              <div class="totals-label">Общо количество</div>
              <div class="totals-value">${itemTotals.totalQuantity}</div>
            </div>
            <div class="totals-item">
              <div class="totals-label">Обща сума</div>
              <div class="totals-value">${itemTotals.totalAmount.toFixed(2)} лв.</div>
            </div>
          </div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  if (documentsLoading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Справки
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab icon={<DocumentIcon />} iconPosition="start" label="Документи" />
          <Tab icon={<ItemIcon />} iconPosition="start" label="Артикули" />
        </Tabs>
      </Box>

      {/* ============= DOCUMENTS TAB ============= */}
      <TabPanel value={activeTab} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Stack direction="row" spacing={2}>
            <Button variant="outlined" startIcon={<ExcelIcon />} onClick={exportDocumentsToExcel} disabled={filteredDocuments.length === 0}>
              Експорт Excel
            </Button>
            <Button variant="outlined" startIcon={<PrintIcon />} onClick={printDocuments} disabled={filteredDocuments.length === 0}>
              Печат
            </Button>
          </Stack>
        </Box>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <FilterIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Филтри</Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Tooltip title="Изчисти филтрите">
                <IconButton onClick={clearDocFilters} size="small"><ClearIcon /></IconButton>
              </Tooltip>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={2.4}>
                <Autocomplete
                  options={clients}
                  getOptionLabel={(option) => option.name}
                  value={clients.find((c) => c.id === docFilters.clientId) || null}
                  onChange={(_, newValue) => setDocFilters({ ...docFilters, clientId: newValue?.id || null })}
                  renderInput={(params) => <TextField {...params} label="Клиент" size="small" />}
                />
              </Grid>
              <Grid item xs={12} md={2.4}>
                <TextField select label="Плащане" size="small" fullWidth value={docFilters.paymentStatus}
                  onChange={(e) => setDocFilters({ ...docFilters, paymentStatus: e.target.value })}>
                  <MenuItem value="ALL">Всички</MenuItem>
                  <MenuItem value="PAID">Платени</MenuItem>
                  <MenuItem value="UNPAID">Неплатени</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={2.4}>
                <TextField label="От дата" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }}
                  value={docFilters.dateFrom} onChange={(e) => setDocFilters({ ...docFilters, dateFrom: e.target.value })} />
              </Grid>
              <Grid item xs={12} md={2.4}>
                <TextField label="До дата" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }}
                  value={docFilters.dateTo} onChange={(e) => setDocFilters({ ...docFilters, dateTo: e.target.value })} />
              </Grid>
              <Grid item xs={12} md={2.4}>
                <TextField select label="Тип документ" size="small" fullWidth value={docFilters.documentType}
                  onChange={(e) => setDocFilters({ ...docFilters, documentType: e.target.value })}>
                  <MenuItem value="ALL">Всички типове</MenuItem>
                  <MenuItem value={DocumentType.INVOICE}>Фактура</MenuItem>
                  <MenuItem value={DocumentType.CREDIT_NOTE}>Кредитно известие</MenuItem>
                  <MenuItem value={DocumentType.DEBIT_NOTE}>Дебитно известие</MenuItem>
                  <MenuItem value={DocumentType.PROFORMA}>Проформа</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card><CardContent>
              <Typography variant="subtitle2" color="text.secondary">Общо документи</Typography>
              <Typography variant="h4">{docTotals.count}</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card><CardContent>
              <Typography variant="subtitle2" color="text.secondary">Обща сума</Typography>
              <Typography variant="h4">{docTotals.totalAmount.toFixed(2)} лв.</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ bgcolor: 'success.light' }}><CardContent>
              <Typography variant="subtitle2" color="success.dark">Платено</Typography>
              <Typography variant="h4" color="success.dark">{docTotals.paidAmount.toFixed(2)} лв.</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ bgcolor: 'error.light' }}><CardContent>
              <Typography variant="subtitle2" color="error.dark">Неплатено</Typography>
              <Typography variant="h4" color="error.dark">{docTotals.unpaidAmount.toFixed(2)} лв.</Typography>
            </CardContent></Card>
          </Grid>
        </Grid>

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>№</TableCell>
                <TableCell>Номер</TableCell>
                <TableCell>Тип</TableCell>
                <TableCell>Клиент</TableCell>
                <TableCell>Дата</TableCell>
                <TableCell>Срок</TableCell>
                <TableCell align="right">Сума</TableCell>
                <TableCell align="center">Статус</TableCell>
                <TableCell>Плащане</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDocuments.map((doc, index) => (
                <TableRow key={doc.id} hover>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell><Typography variant="body2" fontWeight="medium">{doc.fullDocumentNumber}</Typography></TableCell>
                  <TableCell>{getTypeLabel(doc.documentType)}</TableCell>
                  <TableCell>{doc.client.name}</TableCell>
                  <TableCell>{new Date(doc.issueDate).toLocaleDateString('bg-BG')}</TableCell>
                  <TableCell>{new Date(doc.dueDate).toLocaleDateString('bg-BG')}</TableCell>
                  <TableCell align="right"><Typography variant="body2" fontWeight="medium">{doc.totalAmountWithVat.toFixed(2)} лв.</Typography></TableCell>
                  <TableCell align="center">
                    <Chip label={doc.status === 'FINAL' ? 'Приключен' : 'Чернова'} color={doc.status === 'FINAL' ? 'success' : 'warning'} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip label={getPaidLabel(doc)} color={doc.isPaid ? 'success' : 'error'} size="small" variant={doc.isPaid ? 'filled' : 'outlined'} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {filteredDocuments.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">Няма намерени документи</Typography>
          </Box>
        )}
      </TabPanel>

      {/* ============= ITEMS TAB ============= */}
      <TabPanel value={activeTab} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Stack direction="row" spacing={2}>
            <Button variant="outlined" startIcon={<ExcelIcon />} onClick={exportItemsToExcel} disabled={itemSalesData.length === 0}>
              Експорт Excel
            </Button>
            <Button variant="outlined" startIcon={<PrintIcon />} onClick={printItems} disabled={itemSalesData.length === 0}>
              Печат
            </Button>
          </Stack>
        </Box>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <FilterIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Филтри</Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Tooltip title="Изчисти филтрите">
                <IconButton onClick={clearItemFilters} size="small"><ClearIcon /></IconButton>
              </Tooltip>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Autocomplete
                  options={items}
                  getOptionLabel={(option) => `${option.itemNumber} - ${option.name}`}
                  value={items.find((i) => i.id === itemFilters.itemId) || null}
                  onChange={(_, newValue) => setItemFilters({ ...itemFilters, itemId: newValue?.id || null })}
                  renderInput={(params) => <TextField {...params} label="Артикул" size="small" />}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Autocomplete
                  options={clients}
                  getOptionLabel={(option) => option.name}
                  value={clients.find((c) => c.id === itemFilters.clientId) || null}
                  onChange={(_, newValue) => setItemFilters({ ...itemFilters, clientId: newValue?.id || null })}
                  renderInput={(params) => <TextField {...params} label="Клиент" size="small" />}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField label="От дата" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }}
                  value={itemFilters.dateFrom} onChange={(e) => setItemFilters({ ...itemFilters, dateFrom: e.target.value })} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField label="До дата" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }}
                  value={itemFilters.dateTo} onChange={(e) => setItemFilters({ ...itemFilters, dateTo: e.target.value })} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card><CardContent>
              <Typography variant="subtitle2" color="text.secondary">Брой артикули</Typography>
              <Typography variant="h4">{itemSalesData.length}</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: 'info.light' }}><CardContent>
              <Typography variant="subtitle2" color="info.dark">Общо количество</Typography>
              <Typography variant="h4" color="info.dark">{itemTotals.totalQuantity}</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: 'primary.light' }}><CardContent>
              <Typography variant="subtitle2" color="primary.dark">Обща сума</Typography>
              <Typography variant="h4" color="primary.dark">{itemTotals.totalAmount.toFixed(2)} лв.</Typography>
            </CardContent></Card>
          </Grid>
        </Grid>

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>№</TableCell>
                <TableCell>Код</TableCell>
                <TableCell>Артикул</TableCell>
                <TableCell align="right">Количество</TableCell>
                <TableCell align="right">Сума</TableCell>
                <TableCell align="center">Брой документи</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {itemSalesData.map((item, index) => (
                <TableRow key={item.itemId} hover>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell><Typography variant="body2" fontWeight="medium">{item.itemNumber}</Typography></TableCell>
                  <TableCell>{item.itemName}</TableCell>
                  <TableCell align="right"><Typography variant="body2" fontWeight="medium">{item.totalQuantity}</Typography></TableCell>
                  <TableCell align="right"><Typography variant="body2" fontWeight="medium">{item.totalAmount.toFixed(2)} лв.</Typography></TableCell>
                  <TableCell align="center"><Chip label={item.documentCount} size="small" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {itemSalesData.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">Няма намерени артикули</Typography>
          </Box>
        )}
      </TabPanel>
    </Box>
  );
};

export default Reports;
