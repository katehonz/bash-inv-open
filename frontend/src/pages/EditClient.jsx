import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Stack,
  Grid,
  IconButton,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { GET_CLIENT_BY_ID } from '../graphql/queries';
import { UPDATE_CLIENT } from '../graphql/mutations';
import { ClientType, UpdateClientInput } from '../types';

const EditClient = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    address: '',
    vatNumber: '',
    eik: '',
    phone: '',
    email: '',
    website: '',
    clientType: ClientType.B2B,
    isEuVatPayer: false,
    isIndividual: false,
    isActive: true,
    paymentTerms: '',
    creditLimit: '',
    discountPercent: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});

  const { data, loading, error } = useQuery(GET_CLIENT_BY_ID, {
    variables: { id },
    skip: !id,
  });

  const [updateClient, { loading: updating }] = useMutation(UPDATE_CLIENT, {
    onCompleted: () => {
      navigate(`/clients/${id}`);
    },
    onError: (error) => {
      console.error('Error updating client:', error);
    },
  });

  useEffect(() => {
    if (data?.client) {
      const client = data.client;
      setFormData({
        name: client.name || '',
        nameEn: client.nameEn || '',
        address: client.address || '',
        vatNumber: client.vatNumber || '',
        eik: client.eik || '',
        phone: client.phone || '',
        email: client.email || '',
        website: client.website || '',
        clientType: client.clientType || ClientType.B2B,
        isEuVatPayer: client.isEuVatPayer || false,
        isIndividual: client.isIndividual || false,
        isActive: client.isActive !== undefined ? client.isActive : true,
        paymentTerms: client.paymentTerms?.toString() || '',
        creditLimit: client.creditLimit?.toString() || '',
        discountPercent: client.discountPercent?.toString() || '',
        notes: client.notes || '',
      });
    }
  }, [data]);

  const handleInputChange = (field) => (
    event
  ) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Името е задължително';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Невалиден имейл адрес';
    }

    if (formData.creditLimit && isNaN(Number(formData.creditLimit))) {
      newErrors.creditLimit = 'Кредитният лимит трябва да бъде число';
    }

    if (formData.discountPercent && (isNaN(Number(formData.discountPercent)) || Number(formData.discountPercent) < 0 || Number(formData.discountPercent) > 100)) {
      newErrors.discountPercent = 'Отстъпката трябва да бъде число между 0 и 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const input = {
      name: formData.name.trim(),
      nameEn: formData.nameEn.trim() || undefined,
      address: formData.address.trim() || undefined,
      vatNumber: formData.vatNumber.trim() || undefined,
      eik: formData.eik.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      email: formData.email.trim() || undefined,
      website: formData.website.trim() || undefined,
      clientType: formData.clientType,
      isEuVatPayer: formData.isEuVatPayer,
      isIndividual: formData.isIndividual,
      isActive: formData.isActive,
      paymentTerms: formData.paymentTerms.trim() || undefined,
      creditLimit: formData.creditLimit ? Number(formData.creditLimit) : undefined,
      discountPercent: formData.discountPercent ? Number(formData.discountPercent) : undefined,
      notes: formData.notes.trim() || undefined,
    };

    try {
      await updateClient({
        variables: {
          id,
          input,
        },
      });
    } catch (error) {
      console.error('Error updating client:', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Грешка при зареждане на клиента: {error.message}
        </Alert>
      </Box>
    );
  }

  if (!data?.client) {
    return (
      <Box p={3}>
        <Alert severity="warning">
          Клиентът не е намерен
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(`/clients/${id}`)} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          Редактиране на клиент
        </Typography>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSubmit}
          disabled={updating}
        >
          {updating ? 'Запазване...' : 'Запази'}
        </Button>
      </Box>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Основна информация */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Основна информация
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Име *"
                      value={formData.name}
                      onChange={handleInputChange('name')}
                      error={!!errors.name}
                      helperText={errors.name}
                      required
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Име на английски"
                      value={formData.nameEn}
                      onChange={handleInputChange('nameEn')}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Адрес"
                      value={formData.address}
                      onChange={handleInputChange('address')}
                      multiline
                      rows={2}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="ДДС номер"
                      value={formData.vatNumber}
                      onChange={handleInputChange('vatNumber')}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="ЕИК"
                      value={formData.eik}
                      onChange={handleInputChange('eik')}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Контактна информация */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Контактна информация
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="Имейл"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    error={!!errors.email}
                    helperText={errors.email}
                  />

                  <TextField
                    fullWidth
                    label="Телефон"
                    value={formData.phone}
                    onChange={handleInputChange('phone')}
                  />

                  <TextField
                    fullWidth
                    label="Уебсайт"
                    value={formData.website}
                    onChange={handleInputChange('website')}
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Настройки */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Настройки
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Stack spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel>Тип клиент</InputLabel>
                    <Select
                      value={formData.clientType}
                      label="Тип клиент"
                      onChange={handleInputChange('clientType')}
                    >
                      <MenuItem value={ClientType.B2B}>Бизнес (B2B)</MenuItem>
                      <MenuItem value={ClientType.B2C}>Потребител (B2C)</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isActive}
                        onChange={handleInputChange('isActive')}
                      />
                    }
                    label="Активен"
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isEuVatPayer}
                        onChange={handleInputChange('isEuVatPayer')}
                      />
                    }
                    label="ЕС ДДС плащец"
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isIndividual}
                        onChange={handleInputChange('isIndividual')}
                      />
                    }
                    label="Физическо лице"
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Търговски условия */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Търговски условия
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Условия за плащане"
                      value={formData.paymentTerms}
                      onChange={handleInputChange('paymentTerms')}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Кредитен лимит (лв.)"
                      type="number"
                      value={formData.creditLimit}
                      onChange={handleInputChange('creditLimit')}
                      error={!!errors.creditLimit}
                      helperText={errors.creditLimit}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Отстъпка (%)"
                      type="number"
                      value={formData.discountPercent}
                      onChange={handleInputChange('discountPercent')}
                      error={!!errors.discountPercent}
                      helperText={errors.discountPercent}
                      inputProps={{ min: 0, max: 100 }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Бележки"
                      value={formData.notes}
                      onChange={handleInputChange('notes')}
                      multiline
                      rows={4}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={() => navigate(`/clients/${id}`)}
                disabled={updating}
              >
                Отказ
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSubmit}
                disabled={updating}
              >
                {updating ? 'Запазване...' : 'Запази промените'}
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default EditClient;
