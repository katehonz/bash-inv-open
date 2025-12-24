import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Stack, Typography, Box, CircularProgress, IconButton, Autocomplete
} from '@mui/material';
import {
  Close as CloseIcon, Save as SaveIcon, Cancel as CancelIcon,
  TableChart as TableChartIcon
} from '@mui/icons-material';
import { useMutation, useQuery } from '@apollo/client';
import { CREATE_ITEM } from '../graphql/mutations';
import { GET_ACTIVE_VAT_RATES, GET_NOMENCLATURES } from '../graphql/queries';
import { UnitSearchModal } from './UnitSearchModal';

export const AddItemModal = ({
  open,
  onClose,
  onItemAdded,
  initialName = '',
  companyId
}) => {
  const [formData, setFormData] = useState({
    itemNumber: '',
    name: initialName,
    nameEn: '',
    defaultVatRate: 20.0,
    accountingAccountNumber: '',
    companyId: companyId,
    description: '',
    unitOfMeasure: 'C62', // Default to 'брой' code
    unitPrice: 0,
  });

  const [errors, setErrors] = useState({});
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);

  // Зареждаме ДДС ставките
  const { data: vatRatesData } = useQuery(GET_ACTIVE_VAT_RATES);
  const vatRates = vatRatesData?.activeVatRates || [];

  // Зареждаме номенклатурите (Мерни единици)
  const { data: nomenclaturesData, loading: nomenclaturesLoading } = useQuery(GET_NOMENCLATURES);
  const unitsOfMeasure = nomenclaturesData?.allUnitsOfMeasure || [];

  const [createItem, { loading: createLoading }] = useMutation(CREATE_ITEM, {
    onCompleted: (data) => {
      onItemAdded({
        id: data.createItem.id,
        itemNumber: data.createItem.itemNumber,
        name: data.createItem.name,
        unitPrice: data.createItem.unitPrice,
        unitOfMeasure: data.createItem.unitOfMeasure,
        defaultVatRate: data.createItem.defaultVatRate
      });
      handleClose();
    },
    onError: (error) => {
      console.error('Error creating item:', error);
    }
  });

  const handleClose = () => {
    onClose();
    setFormData({
      itemNumber: '',
      name: '',
      nameEn: '',
      defaultVatRate: 20.0,
      accountingAccountNumber: '',
      companyId: companyId,
      description: '',
      unitOfMeasure: 'C62',
      unitPrice: 0,
    });
    setErrors({});
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.itemNumber.trim()) newErrors.itemNumber = 'Номерът на артикула е задължителен';
    if (!formData.name.trim()) newErrors.name = 'Името е задължително';
    if (formData.unitPrice && formData.unitPrice < 0) newErrors.unitPrice = 'Цената не може да бъде отрицателна';
    if (!formData.unitOfMeasure || !unitsOfMeasure.find(u => u.code === formData.unitOfMeasure)) {
      newErrors.unitOfMeasure = 'Изберете мерна единица от списъка';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await createItem({
        variables: { input: formData }
      });
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  React.useEffect(() => {
    if (open && initialName) {
      setFormData(prev => ({ ...prev, name: initialName }));
    }
  }, [open, initialName]);

  // Helper to find selected UOM object - with fallback for loading state
  const selectedUom = unitsOfMeasure.find(u => u.code === formData.unitOfMeasure) ||
    (formData.unitOfMeasure ? { code: formData.unitOfMeasure, name: formData.unitOfMeasure, symbol: formData.unitOfMeasure } : null);
  // Helper to find selected VAT object
  const selectedVat = vatRates.find(v => v.rateValue === formData.defaultVatRate) || null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      className="clean-modal"
      PaperProps={{ sx: { minHeight: '600px', borderRadius: 2 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight="bold">Добавяне на нов артикул</Typography>
          <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Номер на артикул"
                value={formData.itemNumber}
                onChange={(e) => handleChange('itemNumber', e.target.value)}
                error={!!errors.itemNumber}
                helperText={errors.itemNumber}
                required
                fullWidth
                variant="outlined"
              />
              <TextField
                label="Единична цена"
                value={formData.unitPrice}
                onChange={(e) => handleChange('unitPrice', parseFloat(e.target.value) || 0)}
                error={!!errors.unitPrice}
                helperText={errors.unitPrice}
                inputProps={{ inputMode: 'decimal', step: 0.01 }}
                type="number"
                fullWidth
                variant="outlined"
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField
                label="Име (BG)"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                required
                fullWidth
                variant="outlined"
              />
              <TextField
                label="Име (EN)"
                value={formData.nameEn}
                onChange={(e) => handleChange('nameEn', e.target.value)}
                fullWidth
                variant="outlined"
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              {/* VAT Rate Autocomplete */}
              <Autocomplete
                options={vatRates}
                getOptionLabel={(option) => `${option.rateValue}% (${option.rateName})`}
                value={selectedVat}
                onChange={(_, newValue) => {
                  handleChange('defaultVatRate', newValue ? newValue.rateValue : 20.0);
                }}
                fullWidth
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="ДДС ставка"
                    required
                    error={!!errors.defaultVatRate}
                    helperText={errors.defaultVatRate}
                  />
                )}
              />
              
              {/* Unit of Measure Autocomplete with Table Button */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', flex: 1, gap: 0.5 }}>
                <Autocomplete
                  options={unitsOfMeasure}
                  loading={nomenclaturesLoading}
                  getOptionLabel={(option) => {
                    if (typeof option === 'string') return option;
                    return `${option.name} (${option.symbol || option.code})`;
                  }}
                  value={selectedUom}
                  onChange={(_, newValue) => {
                    handleChange('unitOfMeasure', newValue ? newValue.code : 'C62');
                  }}
                  sx={{ flex: 1 }}
                  disableClearable
                  blurOnSelect
                  selectOnFocus
                  handleHomeEndKeys
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
                  renderOption={(props, option) => (
                    <Box component="li" {...props} key={option.code} sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                      <Box>
                        <Typography variant="body2" component="span" fontWeight="medium">
                          {option.name}
                        </Typography>
                        {option.nameEn && option.nameEn !== option.name && (
                          <Typography variant="caption" color="text.secondary" component="span" sx={{ ml: 1 }}>
                            ({option.nameEn})
                          </Typography>
                        )}
                      </Box>
                      <Typography variant="caption" color="primary" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                        {option.symbol || option.code}
                      </Typography>
                    </Box>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Мерна единица"
                      placeholder="Търси: брой, kg, метър..."
                      required
                      error={!!errors.unitOfMeasure}
                      helperText={errors.unitOfMeasure || (selectedUom ? `Код: ${selectedUom.code}` : '')}
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
            </Stack>

            <TextField
              label="Счетоводна сметка"
              value={formData.accountingAccountNumber}
              onChange={(e) => handleChange('accountingAccountNumber', e.target.value)}
              fullWidth
              variant="outlined"
            />

            <TextField
              label="Описание"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              multiline
              rows={3}
              fullWidth
              variant="outlined"
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClose} startIcon={<CancelIcon />} disabled={createLoading} variant="outlined" color="secondary">
            Отказ
          </Button>
          <Button type="submit" variant="contained" startIcon={createLoading ? <CircularProgress size={20} /> : <SaveIcon />} disabled={createLoading}>
            {createLoading ? 'Запазване...' : 'Създай артикул'}
          </Button>
        </DialogActions>
      </form>

      {/* Unit Search Modal */}
      <UnitSearchModal
        open={isUnitModalOpen}
        onClose={() => setIsUnitModalOpen(false)}
        onUnitSelected={(unit) => {
          handleChange('unitOfMeasure', unit.code);
          setIsUnitModalOpen(false);
        }}
        currentUnit={formData.unitOfMeasure}
      />
    </Dialog>
  );
};
