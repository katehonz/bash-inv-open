import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  Stack,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Paper,
  Collapse,
  InputAdornment,
  DialogContentText,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Business as BusinessIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Person as PersonIcon,
  Public as PublicIcon,
} from '@mui/icons-material';
import { useMutation, useLazyQuery } from '@apollo/client';
import { CREATE_CLIENT, CREATE_CLIENT_WITH_VIES } from '../graphql/mutations';
import { GET_VIES_COMPANY_DATA } from '../graphql/queries';

const ClientType = {
  B2B: 'B2B',
  B2C: 'B2C',
};

const AddClientModalFull = ({
  open,
  onClose,
  onClientAdded,
  initialSearchTerm = '',
  companyId = '1',
}) => {
  const [formData, setFormData] = useState({
    name: initialSearchTerm,
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
    companyId: companyId,
  });

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [viesData, setViesData] = useState(null);
  const [isValidatingVat, setIsValidatingVat] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [useViesIntegration, setUseViesIntegration] = useState(true);
  const [vatValidationStatus, setVatValidationStatus] = useState('none');
  const [showViesFailureDialog, setShowViesFailureDialog] = useState(false);
  const [viesSearchTerm, setViesSearchTerm] = useState(initialSearchTerm);

  const [createClient, { loading: loadingBasic }] = useMutation(CREATE_CLIENT, {
    onCompleted: (data) => {
      const newClient = {
        id: data.createClient.id,
        name: data.createClient.name,
        eik: data.createClient.eik,
        vatNumber: data.createClient.vatNumber,
        address: data.createClient.address,
        contactPerson: data.createClient.contactPerson,
        phone: data.createClient.phone,
        email: data.createClient.email,
        website: data.createClient.website,
        clientType: data.createClient.clientType,
        paymentTerms: data.createClient.paymentTerms,
        creditLimit: data.createClient.creditLimit,
        discountPercent: data.createClient.discountPercent,
      };
      onClientAdded(newClient);
      handleClose();
    },
    onError: (error) => {
      console.error('Error creating client:', error);
      setSubmitError(error.message || 'Възникна грешка при създаването на клиента');
    },
  });

  const [createClientWithVies, { loading: loadingVies }] = useMutation(CREATE_CLIENT_WITH_VIES, {
    onCompleted: (data) => {
      const newClient = {
        id: data.createClientWithVies.id,
        name: data.createClientWithVies.name,
        eik: data.createClientWithVies.eik,
        vatNumber: data.createClientWithVies.vatNumber,
        address: data.createClientWithVies.address,
        contactPerson: data.createClientWithVies.contactPerson,
        phone: data.createClientWithVies.phone,
        email: data.createClientWithVies.email,
        website: data.createClientWithVies.website,
        clientType: data.createClientWithVies.clientType,
        paymentTerms: data.createClientWithVies.paymentTerms,
        creditLimit: data.createClientWithVies.creditLimit,
        discountPercent: data.createClientWithVies.discountPercent,
      };
      onClientAdded(newClient);
      handleClose();
    },
    onError: (error) => {
      console.error('Error creating client with VIES:', error);
      if (error.message.includes('VIES')) {
        setShowViesFailureDialog(true);
      } else {
        setSubmitError(error.message || 'Възникна грешка при създаването на клиента');
      }
    },
  });

  const [getViesCompanyData] = useLazyQuery(GET_VIES_COMPANY_DATA, {
    onCompleted: (data) => {
      console.log('[VIES] onCompleted:', data);
      const result = data.getViesCompanyData;
      
      if (result && result.isValid) {
        // Auto-fill form with VIES data
        let newFormData = { ...formData };
        
        if (result.companyName && (!formData.name || formData.name.trim() === '')) {
          newFormData.name = result.companyName;
        }
        if (result.address && (!formData.address || formData.address.trim() === '')) {
          newFormData.address = result.address;
        }
        if (result.vatNumber && (!formData.vatNumber || formData.vatNumber.trim() === '')) {
          newFormData.vatNumber = result.vatNumber;
        }
        // EIK: if vatNumber starts with BG, always fill eik with numeric part
        if (result.vatNumber && result.vatNumber.startsWith('BG')) {
          newFormData.eik = result.vatNumber.replace(/^BG/, '');
        }
        
        setFormData(newFormData);
        
        setViesData({
          vatNumber: result.vatNumber,
          countryCode: result.countryCode,
          name: result.companyName,
          address: result.address,
          requestDate: result.requestDate,
          valid: result.isValid,
        });
        setVatValidationStatus('valid');
      } else {
        setVatValidationStatus('invalid');
        setViesData(null);
      }
      setIsValidatingVat(false);
    },
    onError: (error) => {
      console.error('VIES validation failed:', error);
      setVatValidationStatus('invalid');
      setViesData(null);
      setIsValidatingVat(false);
    },
  });

  const loading = loadingBasic || loadingVies;

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
          getViesCompanyData({
            variables: { vatNumber: formData.vatNumber }
          });
        } else {
          setVatValidationStatus('none');
          setViesData(null);
        }
      }, 1500);

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
    
    // Автоматично извличане на ЕИК от български ДДС номер
    if (field === 'vatNumber' && typeof value === 'string') {
      const upperVatNumber = value.toUpperCase();
      if (upperVatNumber.startsWith('BG') && upperVatNumber.length > 2 && (!formData.eik || formData.eik.trim() === '')) {
        const numericPart = upperVatNumber.replace(/^BG/, '');
        if (numericPart.match(/^\d+$/)) {
          newFormData.eik = numericPart;
        }
      }
    }
    
    setFormData(newFormData);
    
    // Изчистване на грешката при въвеждане
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleManualViesSearch = async () => {
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
      getViesCompanyData({
        variables: { vatNumber: formData.vatNumber }
      });
    } catch (error) {
      console.error('Manual VIES search failed:', error);
      setVatValidationStatus('invalid');
      setViesData(null);
      setIsValidatingVat(false);
    }
  };

  const handleDirectViesSearch = async () => {
    if (!viesSearchTerm || viesSearchTerm.length < 3) {
      return;
    }

    const searchTerm = viesSearchTerm.toUpperCase().trim();
    if (!isEuVatNumber(searchTerm)) {
      return;
    }

    setIsValidatingVat(true);
    setVatValidationStatus('checking');

    try {
      await getViesCompanyData({
        variables: { vatNumber: searchTerm }
      });
      // Auto-fill VAT number field when searching directly
      setFormData(prev => ({ ...prev, vatNumber: searchTerm }));
    } catch (error) {
      console.error('Direct VIES search failed:', error);
      setVatValidationStatus('invalid');
      setViesData(null);
      setIsValidatingVat(false);
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Името на клиента е задължително';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

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
          contactPerson: formData.contactPerson.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          email: formData.email.trim() || undefined,
          website: formData.website.trim() || undefined,
          clientType: formData.clientType,
          paymentTerms: formData.paymentTerms,
          creditLimit: formData.creditLimit,
          discountPercent: formData.discountPercent,
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

  const handleClose = () => {
    setFormData({
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
      companyId: companyId,
    });
    setErrors({});
    setSubmitError('');
    setViesData(null);
    setVatValidationStatus('none');
    setShowAdvanced(false);
    setShowViesFailureDialog(false);
    onClose();
  };

  const handleViesFailureDialogClose = () => {
    setShowViesFailureDialog(false);
  };

  const handleViesFailureProceed = async () => {
    setShowViesFailureDialog(false);
    // Proceed with basic client creation
    try {
      const input = {
        name: formData.name.trim(),
        eik: formData.eik.trim() || undefined,
        address: formData.address.trim() || undefined,
        vatNumber: formData.vatNumber.trim() || undefined,
        contactPerson: formData.contactPerson.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        website: formData.website.trim() || undefined,
        clientType: formData.clientType,
        paymentTerms: formData.paymentTerms,
        creditLimit: formData.creditLimit,
        discountPercent: formData.discountPercent,
        companyId: formData.companyId,
      };

      await createClient({
        variables: { input },
      });
    } catch (err) {
      console.error('Error submitting form:', err);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BusinessIcon color="primary" />
              <Typography variant="h6">Добави нов клиент</Typography>
            </Box>
            <IconButton onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent>
            {submitError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {submitError}
              </Alert>
            )}

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

              {/* Direct VIES Search */}
              {useViesIntegration && (
                <Paper elevation={1} sx={{ p: 2, bgcolor: 'blue.50' }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <PublicIcon color="primary" />
                    Търсене в VIES EU база данни
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Въведете EU ДДС номер за директно търсене и автоматично попълване на данните от VIES
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      label="EU ДДС номер"
                      value={viesSearchTerm}
                      onChange={(e) => setViesSearchTerm(e.target.value.toUpperCase())}
                      placeholder="Например: DE123456789, FR12345678901"
                      fullWidth
                      InputProps={{
                        startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleDirectViesSearch}
                      disabled={!viesSearchTerm || viesSearchTerm.length < 3 || !isEuVatNumber(viesSearchTerm.toUpperCase()) || isValidatingVat}
                      startIcon={isValidatingVat ? <CircularProgress size={20} /> : <SearchIcon />}
                      sx={{ minWidth: 120 }}
                    >
                      {isValidatingVat ? 'Търсене...' : 'Търси'}
                    </Button>
                  </Box>
                </Paper>
              )}

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
                      autoFocus
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
                        <MenuItem value={ClientType.B2B}>B2B (Бизнес)</MenuItem>
                        <MenuItem value={ClientType.B2C}>B2C (Частен)</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                  <TextField
                    label="ЕИК/БУЛСТАТ"
                    value={formData.eik}
                    onChange={(e) => handleInputChange('eik', e.target.value)}
                    fullWidth
                    error={!!errors.eik}
                    helperText={errors.eik}
                    placeholder="123456789"
                  />

                  <TextField
                    label="ДДС номер"
                    value={formData.vatNumber}
                    onChange={(e) => handleInputChange('vatNumber', e.target.value)}
                    fullWidth
                    error={!!errors.vatNumber}
                    helperText={errors.vatNumber}
                    placeholder="BG123456789"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          {getVatValidationIcon()}
                          {formData.vatNumber && isEuVatNumber(formData.vatNumber) && (
                            <IconButton
                              size="small"
                              onClick={handleManualViesSearch}
                              disabled={isValidatingVat}
                              title="Ръчно търсене в VIES"
                            >
                              <RefreshIcon />
                            </IconButton>
                          )}
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <TextField
                  label="Адрес"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  fullWidth
                  multiline
                  rows={2}
                  error={!!errors.address}
                  helperText={errors.address}
                  placeholder="Въведете адрес на клиента"
                />

                {/* VIES Data Display */}
                {viesData && vatValidationStatus === 'valid' && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      VIES валидация успешна:
                    </Typography>
                    <Typography variant="body2">
                      Име: {viesData.name}
                    </Typography>
                    <Typography variant="body2">
                      Адрес: {viesData.address}
                    </Typography>
                    <Typography variant="body2">
                      Държава: {viesData.countryCode}
                    </Typography>
                  </Alert>
                )}
              </Box>

              {/* Advanced Information */}
              <Box>
                <Button
                  variant="text"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  startIcon={showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  sx={{ mb: 1 }}
                >
                  Допълнителна информация
                </Button>

                <Collapse in={showAdvanced}>
                  <Stack spacing={2}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon color="primary" />
                      Контактна информация
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                      <TextField
                        label="Контактно лице"
                        value={formData.contactPerson}
                        onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                        fullWidth
                        placeholder="Име на контактното лице"
                      />

                      <TextField
                        label="Телефон"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        fullWidth
                        placeholder="+359 888 123 456"
                      />
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                      <TextField
                        label="Имейл"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        fullWidth
                        placeholder="email@example.com"
                      />

                      <TextField
                        label="Уебсайт"
                        value={formData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        fullWidth
                        placeholder="https://example.com"
                      />
                    </Box>

                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                      <BusinessIcon color="primary" />
                      Търговски условия
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                      <TextField
                        label="Срок за плащане (дни)"
                        type="number"
                        value={formData.paymentTerms}
                        onChange={(e) => handleInputChange('paymentTerms', parseInt(e.target.value) || 0)}
                        fullWidth
                        inputProps={{ min: 0 }}
                      />

                      <TextField
                        label="Кредитен лимит (лв.)"
                        type="number"
                        value={formData.creditLimit}
                        onChange={(e) => handleInputChange('creditLimit', parseFloat(e.target.value) || 0)}
                        fullWidth
                        inputProps={{ min: 0, step: 0.01 }}
                      />

                      <TextField
                        label="Отстъпка (%)"
                        type="number"
                        value={formData.discountPercent}
                        onChange={(e) => handleInputChange('discountPercent', parseFloat(e.target.value) || 0)}
                        fullWidth
                        inputProps={{ min: 0, max: 100, step: 0.01 }}
                      />
                    </Box>
                  </Stack>
                </Collapse>
              </Box>
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleClose} disabled={loading}>
              Отказ
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              disabled={loading}
            >
              {loading ? 'Записване...' : 'Запиши клиент'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* VIES Failure Dialog */}
      <Dialog open={showViesFailureDialog} onClose={handleViesFailureDialogClose}>
        <DialogTitle>VIES валидация неуспешна</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Възникна проблем при валидацията на ДДС номера чрез VIES системата. 
            Искате ли да продължите със създаването на клиента без VIES данни?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleViesFailureDialogClose}>Отказ</Button>
          <Button onClick={handleViesFailureProceed} variant="contained">
            Продължи без VIES
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AddClientModalFull;
