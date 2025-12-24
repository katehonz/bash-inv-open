import React from 'react';
import {
  Autocomplete,
  TextField,
  Box,
  Typography,
  Chip,
  CircularProgress
} from '@mui/material';
import { useQuery } from '@apollo/client';
import { GET_ALL_VAT_EXEMPTION_REASONS } from '../graphql/queries';

// Category translations
const CATEGORY_LABELS = {
  'G': 'Износ',
  'K': 'ВОД',
  'E': 'Освободена',
  'O': 'Извън обхвата',
  'Z': 'Нулева ставка',
  'AE': 'Обратно начисляване',
  'S': 'Стандартна'
};

const CATEGORY_LABELS_EN = {
  'G': 'Export',
  'K': 'Intra-Community',
  'E': 'Exempt',
  'O': 'Not subject',
  'Z': 'Zero rate',
  'AE': 'Reverse charge',
  'S': 'Standard'
};

const CATEGORY_COLORS = {
  'G': 'success',
  'K': 'info',
  'E': 'warning',
  'O': 'default',
  'Z': 'primary',
  'AE': 'secondary',
  'S': 'default'
};

export const VatExemptionAutocomplete = ({
  value,
  onChange,
  disabled = false,
  required = false,
  error = false,
  helperText = '',
  size = 'small',
  fullWidth = true
}) => {
  const { data, loading } = useQuery(GET_ALL_VAT_EXEMPTION_REASONS);

  const exemptionReasons = React.useMemo(() => {
    if (!data?.allVatExemptionReasons) return [];
    return data.allVatExemptionReasons
      .filter(reason => reason.isActive)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [data]);

  // Find the selected value object
  const selectedValue = React.useMemo(() => {
    if (!value || !exemptionReasons.length) return null;
    return exemptionReasons.find(r => r.id === value) || null;
  }, [value, exemptionReasons]);

  const handleChange = (_, newValue) => {
    onChange(newValue ? newValue.id : null);
  };

  // Custom filter for searching
  const filterOptions = (options, state) => {
    const inputValue = state.inputValue.toLowerCase();
    if (!inputValue) return options;

    return options.filter(option =>
      option.reasonName.toLowerCase().includes(inputValue) ||
      (option.reasonNameEn && option.reasonNameEn.toLowerCase().includes(inputValue)) ||
      option.reasonCode.toLowerCase().includes(inputValue) ||
      option.legalBasis.toLowerCase().includes(inputValue) ||
      (option.ublExemptionCode && option.ublExemptionCode.toLowerCase().includes(inputValue))
    );
  };

  // Group by UBL category
  const groupBy = (option) => {
    const category = option.ublCategoryCode || 'O';
    return CATEGORY_LABELS[category] || category;
  };

  return (
    <Autocomplete
      options={exemptionReasons}
      value={selectedValue}
      onChange={handleChange}
      loading={loading}
      disabled={disabled}
      fullWidth={fullWidth}
      size={size}
      groupBy={groupBy}
      filterOptions={filterOptions}
      getOptionLabel={(option) =>
        `${option.reasonName} (${option.legalBasis})`
      }
      isOptionEqualToValue={(option, value) => option.id === value?.id}
      renderOption={(props, option) => (
        <Box
          component="li"
          {...props}
          key={option.id}
          sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, py: 1 }}
        >
          <Chip
            label={option.ublExemptionCode || option.reasonCode}
            size="small"
            color={CATEGORY_COLORS[option.ublCategoryCode] || 'default'}
            sx={{ minWidth: 100, fontFamily: 'monospace', fontSize: '0.75rem' }}
          />
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" component="div">
              {option.reasonName}
            </Typography>
            <Typography variant="caption" color="text.secondary" component="div">
              {option.legalBasis}
            </Typography>
            {option.reasonNameEn && (
              <Typography variant="caption" color="text.disabled" component="div" sx={{ fontStyle: 'italic' }}>
                {option.reasonNameEn}
              </Typography>
            )}
          </Box>
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Основание за неначисляване на ДДС"
          placeholder="Търси по код, име или правно основание..."
          required={required}
          error={error}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading && <CircularProgress color="inherit" size={20} />}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderGroup={(params) => (
        <li key={params.key}>
          <Box
            sx={{
              position: 'sticky',
              top: '-8px',
              padding: '4px 10px',
              color: 'primary.main',
              backgroundColor: 'background.paper',
              borderBottom: 1,
              borderColor: 'divider',
              fontWeight: 'bold',
              fontSize: '0.875rem'
            }}
          >
            {params.group}
          </Box>
          <ul style={{ padding: 0 }}>{params.children}</ul>
        </li>
      )}
    />
  );
};

export default VatExemptionAutocomplete;
