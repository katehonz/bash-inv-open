import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Stack,
  Alert,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  Divider,
  Collapse,
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
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Public as PublicIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { useMutation, useLazyQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import {
  CREATE_CLIENT_WITH_VIES,
  CREATE_CLIENT
} from '../graphql/mutations';
import {
  GET_VIES_COMPANY_DATA,
  GET_CLIENTS,
} from '../graphql/queries';
import {
  ClientType
} from '../types';

import SuccessNotification from '../components/SuccessNotification';
import { useCompany } from '../context/CompanyContext';

const CreateClient = () => {
  const navigate = useNavigate();
  const { activeCompanyId } = useCompany();
  
  const [formData, setFormData] = useState({
    name: '',
    eik: '',
    vatNumber: '',
    address: '',
    contactPerson: '',
    phone: '',
    email: '',
    website: '',
    clientType: ClientType.B2B,
    paymentTerms: 30,
    creditLimit: 0,
    discountPercent: 0,
    companyId: activeCompanyId,
  });
  
  const [errors, setErrors] = useState({});
  const [viesData, setViesData] = useState(null);
  const [isValidatingVat, setIsValidatingVat] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [useViesIntegration, setUseViesIntegration] = useState(true);
  const [vatValidationStatus, setVatValidationStatus] = useState('none');
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showViesFailureDialog, setShowViesFailureDialog] = useState(false);

  // Mutations
  const [createClientWithVies, { loading: loadingVies }] = useMutation(CREATE_CLIENT_WITH_VIES, {
    onCompleted: (data) => {
      console.log('[CREATE_CLIENT_WITH_VIES] onCompleted:', data);
      const result = data.createClientWithVies;
      if (result.success && result.client) {
        setSuccessMessage('Клиентът е създаден успешно!');
        setShowSuccessNotification(true);
        setTimeout(() => {
          navigate(`/clients/${result.client.id}`);
        }, 2000);
      } else if (result.errorType === 'VIES_INVALID') {
        // VIES failed, offer fallback to manual creation
        setShowViesFailureDialog(true);
      }
    },
    onError: (error) => {
      console.error('Error creating client with VIES:', error);
    },
    refetchQueries: [{ query: GET_CLIENTS, variables: { companyId: activeCompanyId } }],
    awaitRefetchQueries: true,
  });

  const [createClient, { loading: loadingBasic }] = useMutation(CREATE_CLIENT, {
    onCompleted: (data) => {
      console.log('[CREATE_CLIENT] onCompleted:', data);
      setSuccessMessage('Клиентът е създаден успешно!');
      setShowSuccessNotification(true);
      setTimeout(() => {
        navigate(`/clients/${data.createClient.id}`);
      }, 2000);
    },
    onError: (error) => {
      console.error('[CREATE_CLIENT] error:', error);
      alert('Грешка при създаване на клиент: ' + error.message);
    },
    refetchQueries: [{ query: GET_CLIENTS, variables: { companyId: activeCompanyId } }],
    awaitRefetchQueries: true,
  });



  const [getViesCompanyData] = useLazyQuery(GET_VIES_COMPANY_DATA, {
    onCompleted: (data) => {
      console.log('[VIES] onCompleted:', data);
      const result = data.getViesCompanyData;
      // Автоматично попълване на всички възможни полета
      let newFormData = { ...formData };
      let partialFill = false;
      if (result.companyName && (!formData.name || formData.name.trim() === '')) {
        newFormData.name = result.companyName;
        partialFill = true;
      }
      if (result.address && (!formData.address || formData.address.trim() === '')) {
        newFormData.address = result.address;
        partialFill = true;
      }
      if (result.vatNumber && (!formData.vatNumber || formData.vatNumber.trim() === '')) {
        newFormData.vatNumber = result.vatNumber;
        partialFill = true;
      }
      // EIK: ако vatNumber започва с BG, винаги попълвай eik с числовата част
      if (result.vatNumber && result.vatNumber.startsWith('BG')) {
        newFormData.eik = result.vatNumber.replace(/^BG/, '');
        partialFill = true;
        console.log('[VIES] EIK autofill:', newFormData.eik);
      }
      setFormData(newFormData);
      console.log('[VIES] formData after autofill:', newFormData);

      setViesData({
        vatNumber: result.vatNumber,
        countryCode: result.countryCode,
        name: result.companyName,
        address: result.address,
        requestDate: result.requestDate,
        isValid: result.isValid,
      });
      setVatValidationStatus(result.isValid ? 'valid' : 'invalid');
      setIsValidatingVat(false);
      // Покажи съобщение ако има частично попълване
      if (partialFill) {
        setSuccessMessage('Данните от VIES са попълнени автоматично!');
        setShowSuccessNotification(true);
      }
    },
    onError: (error) => {
      console.error('[VIES] Error fetching VIES data:', error);
      setVatValidationStatus('invalid');
      setViesData(null);
      setIsValidatingVat(false);
    },
  });



  // EU VAT number validation
  const isEuVatNumber = (vatNumber) => {
    const euCountries = ['AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK'];
    return euCountries.some(country => vatNumber.startsWith(country));
  };

  // Debounced VAT validation
  useEffect(() => {
    if (formData.vatNumber && formData.vatNumber.length > 2 && useViesIntegration) {
      const timer = setTimeout(() => {
        if (isEuVatNumber(formData.vatNumber)) {
          setIsValidatingVat(true);
          setVatValidationStatus('checking');
          // Use the more comprehensive VIES company data query
          getViesCompanyData({
            variables: { vatNumber: formData.vatNumber }
          });
        } else {
          setVatValidationStatus('none');
          setViesData(null);
        }
      }, 1500); // Increase delay to avoid too many requests

      return () => clearTimeout(timer);
    } else {
      setVatValidationStatus('none');
      setViesData(null);
    }
  }, [formData.vatNumber, useViesIntegration, getViesCompanyData]);

  const handleInputChange = (field, value) => {
    let newFormData = {
      ...formData,
      [field]: value,
    };
    
    // Automatic EIK extraction from Bulgarian VAT number (only if EIK is empty)
    if (field === 'vatNumber' && typeof value === 'string') {
      const upperVatNumber = value.toUpperCase();
      if (upperVatNumber.startsWith('BG') && upperVatNumber.length > 2 && (!formData.eik || formData.eik.trim() === '')) {
        // Extract numeric part from BG prefix
        const numericPart = upperVatNumber.replace(/^BG/, '');
        if (numericPart.match(/^\d+$/)) {
          newFormData.eik = numericPart;
        }
      }
    }
    
    setFormData(newFormData);
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  // Manual VIES search function
  // Manual VIES search function
const handleManualViesSearch = async () => {
  console.log('[VIES] Manual search triggered for VAT:', formData.vatNumber);
  if (!formData.vatNumber || formData.vatNumber.length < 3) {
    setVatValidationStatus('invalid');
    setViesData(null);
    return;
  }

  if (!isEuVatNumber(formData.vatNumber)) {
    setVatValidationStatus('none');
    setViesData(null);
    return;
  }

  setIsValidatingVat(true);
  setVatValidationStatus('checking');

  try {
    // Use the VIES company data query for manual search
    getViesCompanyData({
      variables: { vatNumber: formData.vatNumber }
    });
  } catch (error) {
    console.error('[VIES] Manual VIES search failed:', error);
    setVatValidationStatus('invalid');
    setViesData(null);
    setIsValidatingVat(false);
  }
};



  // Fallback function for manual client creation when VIES fails
  const handleFallbackToManualCreation = async () => {
    setShowViesFailureDialog(false);
    try {
      const input = {
        name: formData.name.trim(),
        eik: formData.eik.trim() || undefined,
        address: formData.address.trim() || undefined,
        vatNumber: formData.vatNumber.trim() || undefined,
        companyId: formData.companyId,
      };

      await createClient({
        variables: { input },
      });
    } catch (error) {
      console.error('Error creating client manually:', error);
    }
  };

  const handleViesFailureDialogClose = () => {
    setShowViesFailureDialog(false);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Името е задължително';
    }

    // EIK validation (required for Bulgarian companies)
    if (formData.clientType === ClientType.B2B && !formData.eik.trim()) {
      newErrors.eik = 'ЕИК е задължителен за фирми';
    }

    if (formData.eik && formData.eik.trim()) {
      const eikRegex = /^\d{9,13}$/;
      if (!eikRegex.test(formData.eik.trim())) {
        newErrors.eik = 'ЕИК трябва да съдържа между 9 и 13 цифри';
      }
    }

    // VAT number validation (optional for companies under 100k BGN)
    if (formData.vatNumber && formData.vatNumber.trim()) {
      if (formData.vatNumber.startsWith('BG')) {
        const vatRegex = /^BG\d{9,10}$/;
        if (!vatRegex.test(formData.vatNumber.trim())) {
          newErrors.vatNumber = 'Българският ДДС номер трябва да е във формат BG + 9-10 цифри';
        }
      } else if (isEuVatNumber(formData.vatNumber) && vatValidationStatus === 'invalid') {
        newErrors.vatNumber = 'Невалиден EU ДДС номер';
      }
    }

    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Невалиден email адрес';
      }
    }

    if (formData.website && formData.website.trim() && !formData.website.startsWith('http')) {
      newErrors.website = 'Уебсайтът трябва да започва с http:// или https://';
    }

    if (formData.paymentTerms < 0) {
      newErrors.paymentTerms = 'Срокът за плащане не може да бъде отрицателен';
    }

    if (formData.discountPercent < 0 || formData.discountPercent > 100) {
      newErrors.discountPercent = 'Отстъпката трябва да е между 0 и 100%';
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
      if (useViesIntegration && formData.vatNumber && isEuVatNumber(formData.vatNumber)) {
        const input = {
          name: formData.name.trim() || undefined,
          vatNumber: formData.vatNumber.trim(),
          address: formData.address.trim() || undefined,
          contactPerson: formData.contactPerson.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          email: formData.email.trim() || undefined,
          website: formData.website.trim() || undefined,
          clientType: formData.clientType,
          paymentTerms: formData.paymentTerms || undefined,
          creditLimit: formData.creditLimit || undefined,
          discountPercent: formData.discountPercent || undefined,
          companyId: formData.companyId,
        };

        await createClientWithVies({
          variables: { input },
        });
      } else {
        const input = {
          name: formData.name.trim(),
          eik: formData.eik.trim() || undefined,
          address: formData.address.trim() || undefined,
          vatNumber: formData.vatNumber.trim() || undefined,
          companyId: formData.companyId,
        };

        await createClient({
          variables: { input },
        });
      }
    } catch (err) {
      console.error('Error submitting form:', err);
    }
  };

  const getVatValidationIcon = () => {
    switch (vatValidationStatus) {
      case 'checking':
        return <CircularProgress size={20} />;
      case 'valid':
        return <CheckIcon color="success" />;
      case 'invalid':
        return <ErrorIcon color="error" />;
      default:
        return null;
    }
  };

  const loading = loadingVies || loadingBasic;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Нов клиент
      </Typography>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {/* VIES Integration Toggle */}
              <Paper elevation={1} sx={{ p: 2, bgcolor: 'grey.50' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={useViesIntegration}
                      onChange={(e) => setUseViesIntegration(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PublicIcon color="primary" />
                      <Typography variant="body1">
                        Използвай VIES EU интеграция за автоматично попълване
                      </Typography>
                    </Box>
                  }
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Когато е активирано, системата автоматично ще валидира EU ДДС номерата и ще попълни данните от VIES базата
                </Typography>
              </Paper>

              {/* Basic Information */}
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessIcon color="primary" />
                Основна информация
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <TextField
                      label="Име на клиента"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      fullWidth
                      required
                      error={!!errors.name}
                      helperText={errors.name}
                      placeholder="Въведете име на клиента"
                    />
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <FormControl fullWidth>
                      <InputLabel>Тип клиент</InputLabel>
                      <Select
                        value={formData.clientType}
                        label="Тип клиент"
                        onChange={(e) => handleInputChange('clientType', e.target.value)}
                      >
                        <MenuItem value={ClientType.B2B}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <BusinessIcon fontSize="small" />
                            B2B (Бизнес)
                          </Box>
                        </MenuItem>
                        <MenuItem value={ClientType.B2C}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon fontSize="small" />
                            B2C (Потребител)
                          </Box>
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <TextField
                      label="ЕИК"
                      value={formData.eik}
                      onChange={(e) => handleInputChange('eik', e.target.value.replace(/\D/g, ''))}
                      fullWidth
                      required={formData.clientType === ClientType.B2B}
                      error={!!errors.eik}
                      helperText={errors.eik || 'Единен идентификационен код (9-13 цифри)'}
                      placeholder="123456789"
                      InputProps={{
                        inputProps: { maxLength: 13 }
                      }}
                    />
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <TextField
                      label="ДДС номер"
                      value={formData.vatNumber}
                      onChange={(e) => {
                        const upperValue = e.target.value.toUpperCase();
                        handleInputChange('vatNumber', upperValue);
                      }}
                      fullWidth
                      error={!!errors.vatNumber}
                      helperText={errors.vatNumber || 'Въведете валиден EU ДДС номер за автоматично попълване'}
                      placeholder="BG123456789"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            {isValidatingVat ? (
                              <CircularProgress size={24} />
                            ) : (
                              <>
                                {getVatValidationIcon()}
                                {isEuVatNumber(formData.vatNumber) && (
                                  <Tooltip title="Потърси в VIES">
                                    <IconButton onClick={handleManualViesSearch} color="primary" size="small">
                                      <SearchIcon />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </>
                            )}
                          </InputAdornment>
                        ),
                      }}
                    />
                    {/* VIES Data Display */}
                    {viesData && (
                      <Box sx={{ mt: 2 }}>
                        <Alert severity="success">
                          <Typography variant="subtitle2" gutterBottom>
                            VIES данни намерени:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                            <Chip label={`${viesData.countryCode} ${viesData.vatNumber}`} color="primary" size="small" />
                            <Chip label={viesData.name} color="default" size="small" />
                            <Chip label={`Проверено: ${new Date(viesData.requestDate).toLocaleDateString('bg-BG')}`} color="info" size="small" />
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<RefreshIcon />}
                              onClick={() => {
                                setFormData(prev => ({ ...prev, name: viesData.name || '', address: viesData.address || '' }));
                                setSuccessMessage('Данните са обновени от VIES!');
                                setShowSuccessNotification(true);
                              }}
                            >
                              Обнови данните
                            </Button>
                          </Box>
                        </Alert>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>

              {/* Address Information */}
              <Divider />
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationIcon color="primary" />
                Адресна информация
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <TextField
                    label="Адрес"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Адрес на клиента"
                  />
                </Box>
              </Box>

              {/* Contact Information */}
              <Divider />
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PhoneIcon color="primary" />
                Контактна информация
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <TextField
                      label="Контактно лице"
                      value={formData.contactPerson}
                      onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                      fullWidth
                      placeholder="Име на контактното лице"
                    />
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <TextField
                      label="Телефон"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      fullWidth
                      placeholder="+359 888 123 456"
                    />
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <TextField
                      label="Email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      fullWidth
                      type="email"
                      error={!!errors.email}
                      helperText={errors.email}
                      placeholder="example@domain.com"
                    />
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <TextField
                      label="Уебсайт"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      fullWidth
                      error={!!errors.website}
                      helperText={errors.website}
                      placeholder="https://example.com"
                    />
                  </Box>
                </Box>
              </Box>

              {/* Advanced Settings */}
              <Divider />
              <Box>
                <Button
                  variant="text"
                  startIcon={showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  Допълнителни настройки
                </Button>
                
                <Collapse in={showAdvanced}>
                  <Box sx={{ mt: 1 }}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <TextField
                          label="Срок за плащане (дни)"
                          value={formData.paymentTerms}
                          onChange={(e) => handleInputChange('paymentTerms', parseInt(e.target.value) || 0)}
                          fullWidth
                          type="number"
                          error={!!errors.paymentTerms}
                          helperText={errors.paymentTerms}
                          InputProps={{ inputProps: { min: 0 } }}
                        />
                      </Box>

                      <Box sx={{ flex: 1 }}>
                        <TextField
                          label="Кредитен лимит (лв.)"
                          value={formData.creditLimit}
                          onChange={(e) => handleInputChange('creditLimit', parseFloat(e.target.value) || 0)}
                          fullWidth
                          type="number"
                          InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                        />
                      </Box>

                      <Box sx={{ flex: 1 }}>
                        <TextField
                          label="Отстъпка (%)"
                          value={formData.discountPercent}
                          onChange={(e) => handleInputChange('discountPercent', parseFloat(e.target.value) || 0)}
                          fullWidth
                          type="number"
                          error={!!errors.discountPercent}
                          helperText={errors.discountPercent}
                          InputProps={{ inputProps: { min: 0, max: 100, step: 0.01 } }}
                        />
                      </Box>
                    </Box>
                  </Box>
                </Collapse>
              </Box>

              {loading && <LinearProgress />}

              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  type="button"
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={() => navigate('/clients')}
                >
                  Отказ
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={loading}
                >
                  {useViesIntegration && formData.vatNumber && isEuVatNumber(formData.vatNumber) 
                    ? 'Създай с VIES' 
                    : 'Създай клиент'}
                </Button>
              </Stack>
            </Stack>
          </form>
        </CardContent>
      </Card>
      
      <Dialog
        open={showViesFailureDialog}
        onClose={handleViesFailureDialogClose}
        aria-labelledby="vies-failure-dialog-title"
        aria-describedby="vies-failure-dialog-description"
      >
        <DialogTitle id="vies-failure-dialog-title">
          VIES валидация неуспешна
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="vies-failure-dialog-description">
            VIES не може да намери този VAT номер в системата. Искате ли да създадете клиента ръчно с въведените данни?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleViesFailureDialogClose} color="primary">
            Отказ
          </Button>
          <Button onClick={handleFallbackToManualCreation} color="primary" variant="contained">
            Създай ръчно
          </Button>
        </DialogActions>
      </Dialog>
      
      <SuccessNotification
        open={showSuccessNotification}
        message={successMessage}
        onClose={() => setShowSuccessNotification(false)}
      />
    </Box>
  );
};


export default CreateClient;