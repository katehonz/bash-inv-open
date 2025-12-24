import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Description as FileIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { GET_DOCUMENTS_BY_COMPANY } from '../graphql/queries';
import { useCompany } from '../context/CompanyContext';

const Documents = () => {
  const navigate = useNavigate();
  const { activeCompanyId } = useCompany();
  const [searchTerm, setSearchTerm] = useState('');

  const { data, loading, error } = useQuery(GET_DOCUMENTS_BY_COMPANY, {
    variables: { companyId: activeCompanyId },
    skip: !activeCompanyId,
    fetchPolicy: 'cache-and-network',
  });

  const documents = data?.documentsByCompany || [];

  const filteredDocuments = documents.filter(doc => 
    doc.documentNumber.includes(searchTerm) || 
    doc.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusChip = (status, isPaid) => {
    if (status === 'CANCELLED') {
      return <Chip label="Анулирана" color="error" size="small" variant="outlined" />;
    }
    if (status === 'DRAFT') {
      return <Chip label="Чернова" color="default" size="small" variant="outlined" />;
    }
    if (isPaid) {
      return <Chip label="Платена" color="success" size="small" />;
    }
    return <Chip label="Издадена" color="primary" size="small" />;
  };

  const getDocumentTypeLabel = (type) => {
    switch (type) {
      case 'INVOICE': return 'Фактура';
      case 'PROFORMA': return 'Проформа';
      case 'CREDIT_NOTE': return 'Кредитно';
      case 'DEBIT_NOTE': return 'Дебитно';
      default: return type;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Документи
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/documents/create')}
          size="large"
        >
          Нов документ
        </Button>
      </Box>

      <Paper sx={{ width: '100%', mb: 2, p: 2 }}>
        {/* Toolbar */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            placeholder="Търсене по номер или клиент..."
            variant="outlined"
            size="small"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <Button variant="outlined" startIcon={<FilterIcon />}>
            Филтри
          </Button>
        </Box>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <TableContainer>
          <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle">
            <TableHead>
              <TableRow>
                <TableCell>Тип</TableCell>
                <TableCell>Номер</TableCell>
                <TableCell>Дата</TableCell>
                <TableCell>Клиент</TableCell>
                <TableCell align="right">Сума</TableCell>
                <TableCell align="center">Статус</TableCell>
                <TableCell align="right">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDocuments.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <Typography color="textSecondary">Няма намерени документи</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDocuments.map((row) => (
                  <TableRow
                    hover
                    key={row.id}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/documents/${row.id}`)}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FileIcon color="action" fontSize="small" />
                        {getDocumentTypeLabel(row.documentType)}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{row.documentNumber}</TableCell>
                    <TableCell>{new Date(row.issueDate).toLocaleDateString('bg-BG')}</TableCell>
                    <TableCell>{row.clientName}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {row.totalAmountWithVat.toFixed(2)} {row.currencyCode}
                    </TableCell>
                    <TableCell align="center">
                      {getStatusChip(row.status, row.isPaid)}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Преглед">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/documents/${row.id}`); }}>
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Редакция">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/documents/${row.id}/edit`); }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default Documents;