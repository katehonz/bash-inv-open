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
import { GET_NOMENCLATURES } from '../graphql/queries';
import PublicIcon from '@mui/icons-material/Public';

export const CountryAutocomplete = ({
  value,
  onChange,
  vatNumber = '',
  disabled = false,
  required = false,
  error = false,
  helperText = '',
  size = 'small',
  fullWidth = true,
  label = 'Държава',
  autoDetectFromVat = true
}) => {
  const { data, loading } = useQuery(GET_NOMENCLATURES);

  const countries = React.useMemo(() => {
    if (!data?.allCountries) return [];
    // Sort: EU countries first, then alphabetically
    return [...data.allCountries].sort((a, b) => {
      if (a.isEuMember !== b.isEuMember) {
        return a.isEuMember ? -1 : 1;
      }
      return a.name.localeCompare(b.name, 'bg');
    });
  }, [data]);

  // Find the selected value object
  const selectedValue = React.useMemo(() => {
    if (!value || !countries.length) return null;
    return countries.find(c => c.code === value) || null;
  }, [value, countries]);

  // Auto-detect country from VAT number
  React.useEffect(() => {
    if (!autoDetectFromVat || !vatNumber || vatNumber.length < 2) return;

    const prefix = vatNumber.substring(0, 2).toUpperCase();
    // Special case for Greece (uses EL in VAT but GR in ISO)
    const countryCode = prefix === 'EL' ? 'GR' : prefix;

    const matchedCountry = countries.find(c => c.code === countryCode);
    if (matchedCountry && matchedCountry.code !== value) {
      onChange(matchedCountry.code);
    }
  }, [vatNumber, countries, autoDetectFromVat, onChange, value]);

  const handleChange = (_, newValue) => {
    onChange(newValue ? newValue.code : null);
  };

  // Custom filter for searching
  const filterOptions = (options, state) => {
    const inputValue = state.inputValue.toLowerCase();
    if (!inputValue) return options;

    return options.filter(option =>
      option.name.toLowerCase().includes(inputValue) ||
      (option.nameEn && option.nameEn.toLowerCase().includes(inputValue)) ||
      option.code.toLowerCase().includes(inputValue)
    );
  };

  // Group by EU membership
  const groupBy = (option) => {
    return option.isEuMember ? 'Европейски съюз' : 'Трети страни';
  };

  return (
    <Autocomplete
      options={countries}
      value={selectedValue}
      onChange={handleChange}
      loading={loading}
      disabled={disabled}
      fullWidth={fullWidth}
      size={size}
      groupBy={groupBy}
      filterOptions={filterOptions}
      getOptionLabel={(option) => `${option.name} (${option.code})`}
      isOptionEqualToValue={(option, value) => option.code === value?.code}
      renderOption={(props, option) => (
        <Box
          component="li"
          {...props}
          key={option.code}
          sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}
        >
          <Chip
            label={option.code}
            size="small"
            color={option.isEuMember ? 'primary' : 'default'}
            variant={option.isEuMember ? 'filled' : 'outlined'}
            sx={{ minWidth: 45, fontFamily: 'monospace', fontWeight: 'bold' }}
          />
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" component="span">
              {option.name}
            </Typography>
            {option.nameEn && option.nameEn !== option.name && (
              <Typography
                variant="caption"
                color="text.secondary"
                component="span"
                sx={{ ml: 1 }}
              >
                ({option.nameEn})
              </Typography>
            )}
          </Box>
          {option.isEuMember && (
            <Chip
              label="ЕС"
              size="small"
              color="info"
              variant="outlined"
              sx={{ fontSize: '0.65rem', height: 18 }}
            />
          )}
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder="Търси държава..."
          required={required}
          error={error}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                <PublicIcon color="action" sx={{ mr: 1, fontSize: 20 }} />
                {params.InputProps.startAdornment}
              </>
            ),
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
              padding: '6px 10px',
              color: params.group === 'Европейски съюз' ? 'primary.main' : 'text.secondary',
              backgroundColor: 'background.paper',
              borderBottom: 1,
              borderColor: 'divider',
              fontWeight: 'bold',
              fontSize: '0.8rem'
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

export default CountryAutocomplete;
