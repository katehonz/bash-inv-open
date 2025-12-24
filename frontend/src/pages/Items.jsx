import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Paper,
  Tooltip,
  CircularProgress,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Badge,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  TableChart as TableChartIcon,
} from '@mui/icons-material';
import { useQuery, useMutation } from '@apollo/client';
import {
  GET_ITEMS_BY_COMPANY,
  GET_ACTIVE_ITEMS_BY_COMPANY,
  SEARCH_ITEMS,
  GET_ACTIVE_VAT_RATES,
  GET_NOMENCLATURES,
} from '../graphql/queries';
import {
  CREATE_ITEM,
  UPDATE_ITEM,
  ACTIVATE_ITEM,
  DEACTIVATE_ITEM,
  DELETE_ITEM,
} from '../graphql/mutations';
import { useCompany } from '../context/CompanyContext';
import { UnitSearchModal } from '../components/UnitSearchModal';



function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

const Items = () => {
  const { activeCompanyId } = useCompany();
  const [activeTab, setActiveTab] = useState(1); // Default to "Активни" tab
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  const [formData, setFormData] = useState({
    itemNumber: '',
    name: '',
    nameEn: '',
    defaultVatRate: 20.0,
    accountingAccountNumber: '',
    companyId: activeCompanyId,
    description: '',
    unitOfMeasure: 'C62',
    unitPrice: 0,
  });

  const [errors, setErrors] = useState({});
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);

  // Queries
  const { data: allItemsData, loading: allItemsLoading, refetch: refetchAllItems, error: itemsError } = useQuery(GET_ITEMS_BY_COMPANY, {
    variables: { companyId: activeCompanyId },
    skip: !activeCompanyId,
  });

  const { data: activeItemsData, loading: activeItemsLoading, refetch: refetchActiveItems } = useQuery(GET_ACTIVE_ITEMS_BY_COMPANY, {
    variables: { companyId: activeCompanyId },
    skip: !activeCompanyId,
  });

  const { data: searchData, loading: searchLoading, refetch: searchItems } = useQuery(SEARCH_ITEMS, {
    variables: { companyId: activeCompanyId, searchTerm },
    skip: !searchTerm || !activeCompanyId,
  });


  // Зареждаме ДДС ставките от глобалните настройки
  const { data: vatRatesData } = useQuery(GET_ACTIVE_VAT_RATES);
  const vatRates = vatRatesData?.activeVatRates || [];

  // Зареждаме мерните единици
  const { data: nomenclaturesData, loading: nomenclaturesLoading } = useQuery(GET_NOMENCLATURES);
  const unitsOfMeasure = nomenclaturesData?.allUnitsOfMeasure || [];

  // Helper to find selected UOM object - with fallback for loading state
  const selectedUom = unitsOfMeasure.find(u => u.code === formData.unitOfMeasure) ||
    (formData.unitOfMeasure ? { code: formData.unitOfMeasure, name: formData.unitOfMeasure, symbol: formData.unitOfMeasure } : null);

  // Mutations
  const [createItem, { loading: createLoading }] = useMutation(CREATE_ITEM, {
    onCompleted: () => {
      setOpenDialog(false);
      resetForm();
      refetchAllItems();
      refetchActiveItems();
    },
    onError: (error) => {
      console.error('Error creating item:', error);
    },
  });

  const [updateItem, { loading: updateLoading }] = useMutation(UPDATE_ITEM, {
    onCompleted: () => {
      setOpenDialog(false);
      resetForm();
      refetchAllItems();
      refetchActiveItems();
    },
    onError: (error) => {
      console.error('Error updating item:', error);
    },
  });

  const [activateItem] = useMutation(ACTIVATE_ITEM, {
    onCompleted: () => {
      refetchAllItems();
      refetchActiveItems();
    },
    onError: (error) => {
      console.error('Error activating item:', error);
      alert('Грешка при активиране: ' + error.message);
    },
  });

  const [deactivateItem] = useMutation(DEACTIVATE_ITEM, {
    onCompleted: () => {
      refetchAllItems();
      refetchActiveItems();
    },
    onError: (error) => {
      console.error('Error deactivating item:', error);
      alert('Грешка при деактивиране: ' + error.message);
    },
  });

  const [deleteItem] = useMutation(DELETE_ITEM, {
    onCompleted: () => {
      refetchAllItems();
      refetchActiveItems();
    },
    onError: (error) => {
      console.error('Error deleting item:', error);
      alert(error.message || 'Грешка при изтриване на артикул');
    },
  });

  const resetForm = () => {
    setFormData({
      itemNumber: '',
      name: '',
      nameEn: '',
      defaultVatRate: 20.0,
      accountingAccountNumber: '',
      companyId: activeCompanyId,
      description: '',
      unitOfMeasure: 'C62',
      unitPrice: 0,
    });
    setEditingItem(null);
    setErrors({});
  };

  const getCurrentItems = () => {
    const allItems = allItemsData?.itemsByCompany || [];

    if (searchTerm && searchData?.searchItems) {
      const searchResults = searchData.searchItems;
      if (activeTab === 0) {
        // All items tab
        return searchResults;
      } else if (activeTab === 1) {
        // Active items tab
        return searchResults.filter((item) => item.isActive);
      } else {
        // Inactive items tab
        return searchResults.filter((item) => !item.isActive);
      }
    }

    if (activeTab === 0) {
      // All items tab
      return allItems;
    } else if (activeTab === 1) {
      // Active items tab
      return allItems.filter((item) => item.isActive);
    } else {
      // Inactive items tab
      return allItems.filter((item) => !item.isActive);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSearchTerm('');
  };

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    
    if (value) {
      searchItems({
        variables: {
          companyId: activeCompanyId,
          searchTerm: value
        }
      });
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.itemNumber.trim()) {
      newErrors.itemNumber = 'Номерът на артикула е задължителен';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Името е задължително';
    }

    if (formData.defaultVatRate < 0 || formData.defaultVatRate > 100) {
      newErrors.defaultVatRate = 'ДДС ставката трябва да е между 0 и 100%';
    }

    if (formData.unitPrice && formData.unitPrice < 0) {
      newErrors.unitPrice = 'Цената не може да бъде отрицателна';
    }

    if (!formData.unitOfMeasure || !unitsOfMeasure.find(u => u.code === formData.unitOfMeasure)) {
      newErrors.unitOfMeasure = 'Изберете мерна единица от списъка';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (editingItem) {
        const updateInput = {
          id: editingItem.id,
          ...formData,
        };
        await updateItem({ variables: { input: updateInput } });
      } else {
        await createItem({ variables: { input: formData } });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      itemNumber: item.itemNumber,
      name: item.name,
      nameEn: item.nameEn || '',
      defaultVatRate: item.defaultVatRate,
      accountingAccountNumber: item.accountingAccountNumber || '',
      companyId: activeCompanyId,
      description: item.description || '',
      unitOfMeasure: item.unitOfMeasure || 'C62',
      unitPrice: item.unitPrice || 0,
    });
    setOpenDialog(true);
  };

  const handleDelete = (item) => {
    setDeletingItem(item);
    setOpenDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (deletingItem) {
      try {
        await deleteItem({ variables: { id: deletingItem.id } });
        setOpenDeleteDialog(false);
        setDeletingItem(null);
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  };

  const handleToggleActive = async (item) => {
    try {
      if (item.isActive) {
        await deactivateItem({ variables: { id: item.id } });
      } else {
        await activateItem({ variables: { id: item.id } });
      }
    } catch (error) {
      console.error('Error toggling item status:', error);
    }
  };

  const loading = allItemsLoading || activeItemsLoading || searchLoading || createLoading || updateLoading;

  const allItems = allItemsData?.itemsByCompany || [];
  const activeItems = allItems.filter((item) => item.isActive);
  const inactiveItems = allItems.filter((item) => !item.isActive);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Управление на артикули
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            resetForm();
            setOpenDialog(true);
          }}
          size="large"
        >
          Добави артикул
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            placeholder="Търсене по име, номер или описание..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          <Tabs value={activeTab} onChange={handleTabChange} aria-label="item tabs">
            <Tab
              label={
                <Badge badgeContent={allItems.length} color="primary">
                  Всички
                </Badge>
              }
              {...a11yProps(0)}
            />
            <Tab
              label={
                <Badge badgeContent={activeItems.length} color="success">
                  Активни
                </Badge>
              }
              {...a11yProps(1)}
            />
            <Tab
              label={
                <Badge badgeContent={inactiveItems.length} color="default">
                  Неактивни
                </Badge>
              }
              {...a11yProps(2)}
            />
          </Tabs>
        </Box>
      </Paper>

      <TabPanel value={activeTab} index={0}>
        <ItemsTable
          items={getCurrentItems()}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <ItemsTable
          items={getCurrentItems()}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <ItemsTable
          items={getCurrentItems()}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
        />
      </TabPanel>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingItem ? 'Редактиране на артикул' : 'Добавяне на нов артикул'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Номер на артикул"
                  value={formData.itemNumber}
                  onChange={(e) => handleInputChange('itemNumber', e.target.value)}
                  fullWidth
                  required
                  error={!!errors.itemNumber}
                  helperText={errors.itemNumber}
                />
                <TextField
                  label="Единична цена"
                  value={formData.unitPrice}
                  onChange={(e) => handleInputChange('unitPrice', parseFloat(e.target.value) || 0)}
                  fullWidth
                  inputProps={{ inputMode: 'decimal' }}
                  error={!!errors.unitPrice}
                  helperText={errors.unitPrice}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Име (BG)"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  fullWidth
                  required
                  error={!!errors.name}
                  helperText={errors.name}
                />
                <TextField
                  label="Име (EN)"
                  value={formData.nameEn}
                  onChange={(e) => handleInputChange('nameEn', e.target.value)}
                  fullWidth
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl sx={{ minWidth: 200 }} required error={!!errors.defaultVatRate}>
                  <InputLabel id="vat-rate-label">ДДС ставка</InputLabel>
                  <Select
                    labelId="vat-rate-label"
                    value={vatRates.length > 0 ? formData.defaultVatRate : ''}
                    onChange={(e) => handleInputChange('defaultVatRate', e.target.value)}
                    label="ДДС ставка"
                  >
                    {vatRates.map((rate) => (
                      <MenuItem key={rate.id} value={rate.rateValue}>
                        {rate.rateName} ({rate.rateValue}%)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Счетоводна сметка"
                  value={formData.accountingAccountNumber}
                  onChange={(e) => handleInputChange('accountingAccountNumber', e.target.value)}
                  sx={{ width: 150 }}
                  inputProps={{ maxLength: 13 }}
                />
              </Box>

              {/* Мерна единица - на цял ред */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Autocomplete
                  options={unitsOfMeasure}
                  getOptionLabel={(option) => {
                    if (typeof option === 'string') return option;
                    return `${option.name} (${option.symbol || option.code})`;
                  }}
                  value={selectedUom}
                  onChange={(_, newValue) => {
                    handleInputChange('unitOfMeasure', newValue ? newValue.code : 'C62');
                  }}
                  fullWidth
                  disableClearable={!!formData.unitOfMeasure}
                  blurOnSelect
                  selectOnFocus
                  isOptionEqualToValue={(option, value) => option.code === value?.code}
                  filterOptions={(options, state) => {
                    const inputValue = state.inputValue.toLowerCase().trim();
                    if (!inputValue) return options;
                    return options.filter(option =>
                      option.name.toLowerCase().includes(inputValue) ||
                      (option.nameEn && option.nameEn.toLowerCase().includes(inputValue)) ||
                      option.code.toLowerCase().includes(inputValue) ||
                      (option.symbol && option.symbol.toLowerCase().includes(inputValue))
                    );
                  }}
                  ListboxProps={{
                    style: { maxHeight: 300 }
                  }}
                  renderOption={(props, option) => (
                    <Box component="li" {...props} key={option.code} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 1 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" component="span" fontWeight="medium">
                          {option.name}
                        </Typography>
                        {option.nameEn && option.nameEn !== option.name && (
                          <Typography variant="caption" color="text.secondary" component="span" sx={{ ml: 1 }}>
                            ({option.nameEn})
                          </Typography>
                        )}
                      </Box>
                      <Chip
                        label={option.symbol || option.code}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontFamily: 'monospace', fontWeight: 'bold', minWidth: 50 }}
                      />
                    </Box>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Мерна единица"
                      placeholder="Търси: брой, килограм, метър, kg, C62..."
                      required
                      error={!!errors.unitOfMeasure}
                      helperText={errors.unitOfMeasure || (selectedUom ? `UN/ECE код: ${selectedUom.code}` : 'Изберете от списъка')}
                    />
                  )}
                />
                <IconButton
                  onClick={() => setIsUnitModalOpen(true)}
                  color="primary"
                  title="Отвори пълна таблица с мерни единици"
                  sx={{ mt: 1 }}
                >
                  <TableChartIcon />
                </IconButton>
              </Box>

              <TextField
                label="Описание"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                fullWidth
                multiline
                rows={3}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)} color="inherit">
              Отказ
            </Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {editingItem ? 'Запази промените' : 'Създай артикул'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Изтриване на артикул</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Сигурни ли сте, че искате да изтриете артикул "{deletingItem?.name}"?
            Това действие е необратимо и артикулът ще бъде изтрит завинаги.
            Ако артикулът се използва в документи, изтриването няма да бъде позволено.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="inherit">
            Отказ
          </Button>
          <Button onClick={confirmDelete} variant="contained" color="error">
            Изтрий
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unit Search Modal */}
      <UnitSearchModal
        open={isUnitModalOpen}
        onClose={() => setIsUnitModalOpen(false)}
        onUnitSelected={(unit) => {
          handleInputChange('unitOfMeasure', unit.code);
          setIsUnitModalOpen(false);
        }}
        currentUnit={formData.unitOfMeasure}
      />
    </Box>
  );
};

const ItemsTable = ({
  items,
  loading,
  onEdit,
  onDelete,
  onToggleActive,
}) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Номер</TableCell>
            <TableCell>Име</TableCell>
            <TableCell>Описание</TableCell>
            <TableCell align="right">Цена</TableCell>
            <TableCell>Мерна единица</TableCell>
            <TableCell align="right">ДДС (%)</TableCell>
            <TableCell>Статус</TableCell>
            <TableCell align="center">Действия</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow 
              key={item.id}
              sx={{ 
                opacity: item.isActive ? 1 : 0.6,
                backgroundColor: item.isActive ? 'inherit' : 'action.hover'
              }}
            >
              <TableCell>
                <Typography variant="body2" fontFamily="monospace">
                  {item.itemNumber}
                </Typography>
              </TableCell>
              <TableCell>
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    {item.name}
                  </Typography>
                  {item.nameEn && (
                    <Typography variant="caption" color="text.secondary">
                      {item.nameEn}
                    </Typography>
                  )}
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {item.description || '-'}
                </Typography>
              </TableCell>
              <TableCell align="right">
                {item.unitPrice ? (
                  <Typography variant="body2">
                    {item.unitPrice.toFixed(2)} лв.
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">-</Typography>
                )}
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {item.unitOfMeasure || '-'}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2">
                  {item.defaultVatRate.toFixed(0)}%
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={item.isActive ? 'Активен' : 'Неактивен'}
                  color={item.isActive ? 'success' : 'default'}
                  size="small"
                />
              </TableCell>
              <TableCell align="center">
                <Stack direction="row" spacing={1} justifyContent="center">
                  <Tooltip title="Редактирай">
                    <IconButton size="small" onClick={() => onEdit(item)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={item.isActive ? 'Деактивирай' : 'Активирай'}>
                    <IconButton 
                      size="small" 
                      onClick={() => onToggleActive(item)}
                      color={item.isActive ? 'warning' : 'success'}
                    >
                      {item.isActive ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                  {item.isActive && (
                    <Tooltip title="Изтрий">
                      <IconButton size="small" onClick={() => onDelete(item)} color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {items.length === 0 && (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Няма намерени артикули.
          </Typography>
        </Box>
      )}
    </TableContainer>
  );
};

export default Items;