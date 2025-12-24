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
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { useMutation, useLazyQuery } from '@apollo/client';
import { CREATE_CLIENT, CREATE_CLIENT_WITH_VIES } from '../graphql/mutations';
import { GET_VIES_COMPANY_DATA } from '../graphql/queries';
import CountryAutocomplete from './CountryAutocomplete';

enum ClientType {
  B2B = 'B2B',
  B2C = 'B2C',
}

interface Client {
  id: string;
  name: string;
  eik: string | null;
  vatNumber: string | null;
  address: string | null;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  clientType?: ClientType;
  paymentTerms?: number;
  creditLimit?: number;
  discountPercent?: number;
}

interface CreateClientInput {
  name: string;
  eik?: string;
  vatNumber?: string;
  address?: string;
  countryCode?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  website?: string;
  clientType?: ClientType;
  paymentTerms?: number;
  creditLimit?: number;
  discountPercent?: number;
  companyId: string;
}

interface CreateClientWithViesInput {
  name: string;
  eik?: string;
  vatNumber?: string;
  address?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  website?: string;
  clientType?: ClientType;
  paymentTerms?: number;
  creditLimit?: number;
  discountPercent?: number;
  companyId: string;
  viesData?: {
    name?: string;
    address?: string;
    vatNumber?: string;
    countryCode?: string;
    requestDate?: string;
    valid?: boolean;
  };
}

interface ViesData {
  name?: string;
  address?: string;
  vatNumber?: string;
  countryCode?: string;
  requestDate?: string;
  valid?: boolean;
}

interface AddClientModalProps {
  open: boolean;
  onClose: () => void;
  onClientAdded: (client: Client) => void;
  initialSearchTerm?: string;
  companyId?: string;
}

interface FormData {
  name: string;
  eik: string;
  vatNumber: string;
  address: string;
  countryCode: string;
  contactPerson: string;
  phone: string;
  email: string;
  website: string;
  clientType: ClientType;
  paymentTerms: number;
  creditLimit: number;
  discountPercent: number;
  companyId: string;
}

const AddClientModal: React.FC<AddClientModalProps> = ({
  open,
  onClose,
  onClientAdded,
  initialSearchTerm = '',
  companyId = '1',
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: initialSearchTerm,
    eik: '',
    vatNumber: '',
    address: '',
    countryCode: '',
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

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>('');
  const [viesData, setViesData] = useState<ViesData | null>(null);
  const [isValidatingVat, setIsValidatingVat] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [useViesIntegration, setUseViesIntegration] = useState(true);
  const [vatValidationStatus, setVatValidationStatus] = useState<'none' | 'valid' | 'invalid' | 'checking'>('none');
  const [showViesFailureDialog, setShowViesFailureDialog] = useState(false);

  const [createClient, { loading: loadingBasic }] = useMutation(CREATE_CLIENT, {
    onCompleted: (data) => {
      const newClient: Client = {
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
      const newClient: Client = {
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
      if (data.viesCompanyData) {
        setViesData(data.viesCompanyData);
        setVatValidationStatus('valid');
        
        // Auto-fill form with VIES data
        if (data.viesCompanyData.name && !formData.name.trim()) {
          setFormData(prev => ({ ...prev, name: data.viesCompanyData.name }));
        }
        if (data.viesCompanyData.address && !formData.address.trim()) {
          setFormData(prev => ({ ...prev, address: data.viesCompanyData.address }));
        }
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

  // EU VAT number validation
  const isEuVatNumber = (vatNumber: string) => {
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

  const handleInputChange = (field: keyof FormData, value: string | number) => {
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

  // Manual VIES search function
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Името на клиента е задължително';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const loading = loadingBasic || loadingVies;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) {
      return;
    }

    try {
      const input: CreateClientInput = {
        name: formData.name.trim(),
        eik: formData.eik.trim() || undefined,
        vatNumber: formData.vatNumber.trim() || undefined,
        address: formData.address.trim() || undefined,
        countryCode: formData.countryCode || undefined,
        companyId: companyId,
      };

      await createClient({
        variables: { input },
      });
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
      countryCode: '',
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
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
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

          <Stack spacing={2}>
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

            <Box sx={{ display: 'flex', gap: 2 }}>
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

            <CountryAutocomplete
              value={formData.countryCode}
              onChange={(code) => handleInputChange('countryCode', code || '')}
              vatNumber={formData.vatNumber}
              autoDetectFromVat={true}
              size="medium"
              helperText="Автоматично се попълва от ДДС номера"
            />
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
  );
};

export default AddClientModal;
