import React, { useState, useEffect } from 'react';
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
  IconButton,
  TextField,
  Stack,
  LinearProgress,
  Alert,
  Chip,
  Tooltip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Avatar,
  Divider,
  InputAdornment,
  Fab,
  Collapse,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Public as PublicIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Web as WebIcon,
  LocationOn as LocationIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Clear as ClearIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useQuery, useLazyQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { GET_CLIENTS } from '../graphql/queries';
import {
  VALIDATE_VAT_NUMBER,
  GET_VIES_COMPANY_DATA,
  SEARCH_CLIENT_BY_VAT_NUMBER
} from '../graphql/queries';
import { ClientType } from '../types';
import { useCompany } from '../context/CompanyContext';

const Clients = () => {
  const navigate = useNavigate();
  const { activeCompanyId } = useCompany();
  
  const [filters, setFilters] = useState({
    searchTerm: '',
    clientType: 'ALL',
    hasVatNumber: 'ALL',
    isEuVatPayer: 'ALL',
    isActive: 'ALL',
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [viesValidationDialog, setViesValidationDialog] = useState(false);
  const [validatingVatNumber, setValidatingVatNumber] = useState('');

  const { data, loading, error, refetch } = useQuery(GET_CLIENTS, {
    variables: {
      companyId: activeCompanyId,
    },
    pollInterval: 30000, // Refresh every 30 seconds
    fetchPolicy: 'cache-and-network', // Ensure we always get the latest data
    onCompleted: (fetchedData) => {
      console.log('Query completed, fetched data:', fetchedData);
    },
  });

  const [validateVatNumber, { loading: validatingVat }] = useLazyQuery(VALIDATE_VAT_NUMBER, {
    onCompleted: (data) => {
      console.log('VAT validation result:', data.validateVatNumber);
    },
    onError: (error) => {
      console.error('VAT validation error:', error);
    },
  });

  const [getViesCompanyData] = useLazyQuery(GET_VIES_COMPANY_DATA);
  const [searchClientByVatNumber] = useLazyQuery(SEARCH_CLIENT_BY_VAT_NUMBER);

  const clients = data?.clientsByCompany || [];

  useEffect(() => {
    console.log('Clients data updated in component:', clients);
  }, [clients]);

  // Check if VAT number is EU format
  const isEuVatNumber = (vatNumber) => {
    const euCountries = ['AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK'];
    return euCountries.some(country => vatNumber.startsWith(country));
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      clientType: 'ALL',
      hasVatNumber: 'ALL',
      isEuVatPayer: 'ALL',
      isActive: 'YES',
    });
  };

  const handleClientClick = (client) => {
    setSelectedClient(client);
    setShowClientDetails(true);
  };

  const handleVatValidation = (vatNumber) => {
    setValidatingVatNumber(vatNumber);
    setViesValidationDialog(true);
    validateVatNumber({
      variables: { vatNumber }
    });
  };

  const getClientTypeIcon = (clientType) => {
    return clientType === ClientType.B2B ? <BusinessIcon /> : <PersonIcon />;
  };

  const getClientTypeColor = (clientType) => {
    return clientType === ClientType.B2B ? 'primary' : 'secondary';
  };

  const getVatStatusChip = (client) => {
    if (!client.vatNumber) {
      return <Chip label="Без ДДС" size="small" color="default" />;
    }
    
    if (client.isEuVatPayer) {
      return (
        <Chip 
          label="EU ДДС" 
          size="small" 
          color="success"
          icon={<PublicIcon />}
        />
      );
    }
    
    if (client.vatNumber.startsWith('BG')) {
      return (
        <Chip 
          label="BG ДДС" 
          size="small" 
          color="info"
        />
      );
    }
    
    return (
      <Chip 
        label="ДДС" 
        size="small" 
        color="warning"
      />
    );
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Грешка при зареждане на клиентите: {error.message}
      </Alert>
    );
  }

  // Apply filters
  const filteredClients = clients.filter((client) => {
    const matchesSearch = client.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                         (client.vatNumber && client.vatNumber.toLowerCase().includes(filters.searchTerm.toLowerCase())) ||
                         (client.email && client.email.toLowerCase().includes(filters.searchTerm.toLowerCase())) ||
                         (client.phone && client.phone.includes(filters.searchTerm));
    
    const matchesType = filters.clientType === 'ALL' || client.clientType === filters.clientType;
    const matchesVat = filters.hasVatNumber === 'ALL' || 
                      (filters.hasVatNumber === 'YES' && client.vatNumber) ||
                      (filters.hasVatNumber === 'NO' && !client.vatNumber);
    const matchesEuVat = filters.isEuVatPayer === 'ALL' || 
                        (filters.isEuVatPayer === 'YES' && client.isEuVatPayer) ||
                        (filters.isEuVatPayer === 'NO' && !client.isEuVatPayer);
    const matchesActive = filters.isActive === 'ALL' || 
                         (filters.isActive === 'YES' && client.isActive) ||
                         (filters.isActive === 'NO' && !client.isActive);

    return matchesSearch && matchesType && matchesVat && matchesEuVat && matchesActive;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Клиенти
          <Badge badgeContent={filteredClients.length} color="primary" sx={{ ml: 2 }}>
            <Box />
          </Badge>
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
          >
            Обнови
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/clients/create')}
          >
            Нов клиент
          </Button>
        </Stack>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                placeholder="Търси по име, ДДС номер, email или телефон..."
                variant="outlined"
                size="small"
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ flexGrow: 1 }}
              />
              <Button
                variant="outlined"
                startIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                onClick={() => setShowFilters(!showFilters)}
              >
                Филтри
              </Button>
              {(filters.searchTerm || filters.clientType !== 'ALL' || filters.hasVatNumber !== 'ALL' || filters.isEuVatPayer !== 'ALL' || filters.isActive !== 'YES') && (
                <Button
                  variant="text"
                  startIcon={<ClearIcon />}
                  onClick={clearFilters}
                >
                  Изчисти
                </Button>
              )}
            </Box>

            <Collapse in={showFilters}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ minWidth: 200, flex: 1 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Тип клиент</InputLabel>
                    <Select
                      value={filters.clientType}
                      label="Тип клиент"
                      onChange={(e) => handleFilterChange('clientType', e.target.value)}
                    >
                      <MenuItem value="ALL">Всички</MenuItem>
                      <MenuItem value={ClientType.B2B}>B2B (Бизнес)</MenuItem>
                      <MenuItem value={ClientType.B2C}>B2C (Потребител)</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ minWidth: 200, flex: 1 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>ДДС статус</InputLabel>
                    <Select
                      value={filters.hasVatNumber}
                      label="ДДС статус"
                      onChange={(e) => handleFilterChange('hasVatNumber', e.target.value)}
                    >
                      <MenuItem value="ALL">Всички</MenuItem>
                      <MenuItem value="YES">С ДДС номер</MenuItem>
                      <MenuItem value="NO">Без ДДС номер</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ minWidth: 200, flex: 1 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>EU ДДС</InputLabel>
                    <Select
                      value={filters.isEuVatPayer}
                      label="EU ДДС"
                      onChange={(e) => handleFilterChange('isEuVatPayer', e.target.value)}
                    >
                      <MenuItem value="ALL">Всички</MenuItem>
                      <MenuItem value="YES">EU ДДС плащци</MenuItem>
                      <MenuItem value="NO">Не EU ДДС плащци</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ minWidth: 200, flex: 1 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Статус</InputLabel>
                    <Select
                      value={filters.isActive}
                      label="Статус"
                      onChange={(e) => handleFilterChange('isActive', e.target.value)}
                    >
                      <MenuItem value="ALL">Всички</MenuItem>
                      <MenuItem value="YES">Активни</MenuItem>
                      <MenuItem value="NO">Неактивни</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </Collapse>
          </Stack>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Клиент</TableCell>
              <TableCell>Тип</TableCell>
              <TableCell>ДДС номер</TableCell>
              <TableCell>Контакт</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow key={client.id} hover sx={{ cursor: 'pointer' }}>
                <TableCell onClick={() => handleClientClick(client)}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: getClientTypeColor(client.clientType) }}>
                      {getClientTypeIcon(client.clientType)}
                    </Avatar>
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        {client.name}
                      </Typography>
                      {client.address && (
                        <Typography variant="body2" color="text.secondary">
                          {client.address}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Chip 
                    label={client.clientType === ClientType.B2B ? 'Бизнес' : 'Потребител'}
                    size="small"
                    color={getClientTypeColor(client.clientType)}
                  />
                </TableCell>
                
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {client.vatNumber ? (
                      <>
                        <Typography variant="body2">
                          {client.vatNumber}
                        </Typography>
                        {isEuVatNumber(client.vatNumber) && (
                          <Tooltip title="Валидирай в VIES">
                            <IconButton 
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVatValidation(client.vatNumber);
                              }}
                            >
                              <PublicIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Stack spacing={0.5}>
                    {client.email && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {client.email}
                        </Typography>
                      </Box>
                    )}
                    {client.phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {client.phone}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </TableCell>
                
                <TableCell>
                  <Stack spacing={1}>
                    {getVatStatusChip(client)}
                    <Chip 
                      label={client.isActive ? 'Активен' : 'Неактивен'}
                      size="small"
                      color={client.isActive ? 'success' : 'default'}
                    />
                  </Stack>
                </TableCell>
                
                <TableCell align="right">
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Преглед">
                      <IconButton 
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/clients/${client.id}`);
                        }}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Редактиране">
                      <IconButton 
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/clients/${client.id}/edit`);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredClients.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 2 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Няма намерени клиенти
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {filters.searchTerm || filters.clientType !== 'ALL' || filters.hasVatNumber !== 'ALL' || filters.isEuVatPayer !== 'ALL' || filters.isActive !== 'YES'
              ? 'Опитайте да промените филтрите'
              : 'Създайте първия си клиент'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/clients/create')}
          >
            Създай клиент
          </Button>
        </Paper>
      )}

      {/* Client Details Dialog */}
      <Dialog
        open={showClientDetails}
        onClose={() => setShowClientDetails(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: selectedClient ? getClientTypeColor(selectedClient.clientType) : 'primary' }}>
              {selectedClient ? getClientTypeIcon(selectedClient.clientType) : <BusinessIcon />}
            </Avatar>
            <Box>
              <Typography variant="h6">{selectedClient?.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedClient?.clientType === ClientType.B2B ? 'Бизнес клиент' : 'Частен клиент'}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedClient && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Основна информация
                  </Typography>
                  <Stack spacing={2}>
                    {selectedClient.vatNumber && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">ДДС номер:</Typography>
                        <Typography variant="body2">{selectedClient.vatNumber}</Typography>
                        {getVatStatusChip(selectedClient)}
                      </Box>
                    )}
                    {selectedClient.address && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">Адрес:</Typography>
                        <Typography variant="body2">{selectedClient.address}</Typography>
                      </Box>
                    )}
                  </Stack>
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Контактна информация
                  </Typography>
                  <Stack spacing={2}>
                    {selectedClient.contactPerson && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon fontSize="small" color="action" />
                        <Typography variant="body2">{selectedClient.contactPerson}</Typography>
                      </Box>
                    )}
                    {selectedClient.phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2">{selectedClient.phone}</Typography>
                      </Box>
                    )}
                    {selectedClient.email && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon fontSize="small" color="action" />
                        <Typography variant="body2">{selectedClient.email}</Typography>
                      </Box>
                    )}
                    {selectedClient.website && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WebIcon fontSize="small" color="action" />
                        <Typography variant="body2">{selectedClient.website}</Typography>
                      </Box>
                    )}
                  </Stack>
                </Box>
              </Box>

              {(selectedClient.paymentTerms || selectedClient.creditLimit || selectedClient.discountPercent) && (
                <Box>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Търговски условия
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                    {selectedClient.paymentTerms && (
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color="text.secondary">Срок за плащане:</Typography>
                        <Typography variant="body2">{selectedClient.paymentTerms} дни</Typography>
                      </Box>
                    )}
                    {selectedClient.creditLimit && (
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color="text.secondary">Кредитен лимит:</Typography>
                        <Typography variant="body2">{selectedClient.creditLimit} лв.</Typography>
                      </Box>
                    )}
                    {selectedClient.discountPercent && (
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color="text.secondary">Отстъпка:</Typography>
                        <Typography variant="body2">{selectedClient.discountPercent}%</Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowClientDetails(false)}>
            Затвори
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setShowClientDetails(false);
              navigate(`/clients/${selectedClient?.id}/edit`);
            }}
          >
            Редактирай
          </Button>
        </DialogActions>
      </Dialog>

      {/* VIES Validation Dialog */}
      <Dialog
        open={viesValidationDialog}
        onClose={() => setViesValidationDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PublicIcon color="primary" />
            VIES валидация
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="body1">
              Валидира се: <strong>{validatingVatNumber}</strong>
            </Typography>
            {validatingVat && <CircularProgress size={20} />}
          </Box>
          
          {validatingVat && (
            <Alert severity="info">
              Проверява се в VIES системата...
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViesValidationDialog(false)}>
            Затвори
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
        onClick={() => navigate('/clients/create')}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default Clients;