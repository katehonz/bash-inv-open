import React, { useState, useEffect } from 'react';
import { useLazyQuery, useMutation } from '@apollo/client';
import { GET_VIES_COMPANY_DATA } from '../graphql/queries';
import { CREATE_CLIENT_WITH_VIES } from '../graphql/mutations';
import { useCompany } from '../context/CompanyContext';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Box,
  Typography,
  Alert,
  Paper
} from '@mui/material';

export const ViesClientSearchModal = ({
  open,
  onClose,
  onClientAdded,
  initialSearchValue = '',
  companyId,
}) => {
  const [vatNumber, setVatNumber] = useState(initialSearchValue);
  const [clientData, setClientData] = useState(null);

  const [searchVies, { loading: searchLoading, error: searchError, data: viesData }] = useLazyQuery(GET_VIES_COMPANY_DATA);
  const [createClient, { loading: createLoading, error: createError }] = useMutation(CREATE_CLIENT_WITH_VIES);

  const handleSearch = () => {
    if (!vatNumber) return;
    setClientData(null);
    searchVies({ variables: { vatNumber } });
  };

  const handleAddClient = async () => {
    if (!viesData?.getViesCompanyData) return;

    const viesData_company = viesData.getViesCompanyData;
    // Извличаме ЕИК като премахваме кода на държавата (първите 2 букви)
    const eik = viesData_company.vatNumber ? viesData_company.vatNumber.replace(/^[A-Z]{2}/, '') : '';

    try {
      const result = await createClient({
        variables: {
          input: {
            companyId: companyId,
            vatNumber: viesData_company.vatNumber,
            name: viesData_company.companyName,
            eik: eik,
            address: viesData_company.address,
          },
        },
      });

      if (result.data?.createClientWithVies?.client) {
        onClientAdded(result.data.createClientWithVies.client);
        onClose();
      } else if (result.data?.createClientWithVies?.errors) {
        // Handle potential creation errors returned from the backend
        const errorMessage = result.data.createClientWithVies.errors.map((e) => e.message).join(', ');
        console.error('Error creating client:', errorMessage);
      }
    } catch (e) {
      console.error('Failed to create client:', e);
    }
  };

  useEffect(() => {
    if (viesData?.getViesCompanyData) {
      setClientData(viesData.getViesCompanyData);
    } else {
      setClientData(null);
    }
  }, [viesData]);

  useEffect(() => {
    if (open) {
      setVatNumber(initialSearchValue);
      setClientData(null);
    }
  }, [open, initialSearchValue]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Търсене на клиент в VIES</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <TextField
            label="ДДС номер"
            value={vatNumber}
            onChange={(e) => setVatNumber(e.target.value)}
            fullWidth
            variant="outlined"
            disabled={searchLoading || createLoading}
            placeholder="Напр. BG205324786"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} variant="contained" disabled={searchLoading || createLoading} sx={{ height: '56px' }}>
            {searchLoading ? <CircularProgress size={24} /> : 'Търси'}
          </Button>
        </Box>
        {(searchError || createError) && (
          <Alert severity="error">
            {searchError?.message || createError?.message}
          </Alert>
        )}
        {clientData && (
          <Box component={Paper} elevation={2} sx={{ p: 2, mt: 2 }}>
            <Typography variant="h6">Намерен клиент:</Typography>
            <Typography><b>Име:</b> {clientData.companyName}</Typography>
            <Typography><b>ДДС номер:</b> {clientData.vatNumber}</Typography>
            <Typography><b>ЕИК:</b> {clientData.vatNumber ? clientData.vatNumber.replace(/^[A-Z]{2}/, '') : ''}</Typography>
            <Typography><b>Адрес:</b> {clientData.address}</Typography>
            <Typography><b>Валиден:</b> {clientData.isValid ? 'Да' : 'Не'}</Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отказ</Button>
        <Button onClick={handleAddClient} variant="contained" disabled={!clientData || createLoading}>
          {createLoading ? <CircularProgress size={24} color="inherit" /> : 'Добави клиент'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
