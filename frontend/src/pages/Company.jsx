import React, { useState } from 'react';
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
  Switch,
  FormControlLabel,
  Divider,
  Chip,
} from '@mui/material';
import {
  Save as SaveIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { useMutation, useQuery } from '@apollo/client';
import { GET_COMPANY_DETAILS } from '../graphql/queries';
import { UPDATE_COMPANY } from '../graphql/mutations';
import SuccessNotification from '../components/SuccessNotification';
import { useCompany } from '../context/CompanyContext';

const Company = () => {
  const { activeCompanyId } = useCompany();
  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    eik: '',
    vatNumber: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    isVatRegistered: false,
    taxRegistrationDate: '',
    logoUrl: '',
    companyStampUrl: '',
    signatureUrl: '',
    invoiceFooter: '',
    invoiceFooterEn: '',
    defaultPaymentTerms: 14,
    compiledBy: '',
  });

  const [errors, setErrors] = useState({});
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);

  const { data, loading: loadingCompany, error: companyError } = useQuery(GET_COMPANY_DETAILS, {
    variables: { id: activeCompanyId },
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data && data.companyById) {
        const companyData = {
          id: data.companyById.id,
          name: data.companyById.name || '',
          nameEn: data.companyById.nameEn || '',
          eik: data.companyById.eik || '',
          vatNumber: data.companyById.vatNumber || '',
          isVatRegistered: data.companyById.isVatRegistered || false,
          taxRegistrationDate: data.companyById.taxRegistrationDate ? new Date(data.companyById.taxRegistrationDate).toISOString().split('T')[0] : '',
          address: data.companyById.address || '',
          phone: data.companyById.phone || '',
          email: data.companyById.email || '',
          website: data.companyById.website || '',
          logoUrl: data.companyById.logoUrl || '',
          companyStampUrl: data.companyById.companyStampUrl || '',
          signatureUrl: data.companyById.signatureUrl || '',
          defaultPaymentTerms: data.companyById.defaultPaymentTerms || 15,
          invoiceFooter: data.companyById.invoiceFooter || '',
          invoiceFooterEn: data.companyById.invoiceFooterEn || '',
          compiledBy: data.companyById.compiledBy || '',
        };
        setFormData(companyData);
      }
    },
  });

  const [updateCompany, { loading: updating }] = useMutation(UPDATE_COMPANY, {
    refetchQueries: [{ query: GET_COMPANY_DETAILS, variables: { id: activeCompanyId } }],
    onCompleted: () => {
      setShowSuccessNotification(true);
    },
    onError: (error) => {
      console.error('Error updating company:', error);
    },
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
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

    if (!formData.name.trim()) {
      newErrors.name = 'Името на фирмата е задължително';
    }

    if (!formData.eik.trim()) {
      newErrors.eik = 'ЕИК е задължителен';
    } else {
      const eikRegex = /^\d{9,13}$/;
      if (!eikRegex.test(formData.eik.trim())) {
        newErrors.eik = 'ЕИК трябва да съдържа между 9 и 13 цифри';
      }
    }

    if (formData.vatNumber && formData.vatNumber.trim()) {
      const vatRegex = /^BG\d{9,10}$/;
      if (!vatRegex.test(formData.vatNumber.trim())) {
        newErrors.vatNumber = 'ДДС номер трябва да е във формат BG + 9-10 цифри';
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


    if (formData.defaultPaymentTerms < 0) {
      newErrors.defaultPaymentTerms = 'Срокът за плащане не може да бъде отрицателен';
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
      await updateCompany({
        variables: {
          id: activeCompanyId,
          input: {
            name: formData.name.trim(),
            nameEn: formData.nameEn.trim() || undefined,
            eik: formData.eik.trim(),
            vatNumber: formData.vatNumber.trim() || undefined,
            address: formData.address.trim() || undefined,
            phone: formData.phone.trim() || undefined,
            email: formData.email.trim() || undefined,
            website: formData.website.trim() || undefined,
            isVatRegistered: formData.isVatRegistered,
            taxRegistrationDate: formData.taxRegistrationDate || undefined,
            logoUrl: formData.logoUrl.trim() || undefined,
            companyStampUrl: formData.companyStampUrl.trim() || undefined,
            signatureUrl: formData.signatureUrl.trim() || undefined,
            invoiceFooter: formData.invoiceFooter.trim() || undefined,
            invoiceFooterEn: formData.invoiceFooterEn.trim() || undefined,
            defaultPaymentTerms: formData.defaultPaymentTerms,
            compiledBy: formData.compiledBy.trim() || undefined,
          },
        },
      });
    } catch (err) {
      console.error('Error submitting form:', err);
    }
  };

  const loading = loadingCompany || updating;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Данни за фирмата
      </Typography>


      {companyError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Грешка при зареждане на данните: {companyError.message}
        </Alert>
      )}

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Stack spacing={4}>
              
              {/* Basic Information */}
              <Box>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <BusinessIcon color="primary" />
                  Основна информация
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <TextField
                        label="Име на фирмата"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        fullWidth
                        required
                        error={!!errors.name}
                        helperText={errors.name}
                        placeholder="Официално име на фирмата"
                      />
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <TextField
                        label="Име на английски"
                        value={formData.nameEn}
                        onChange={(e) => handleInputChange('nameEn', e.target.value)}
                        fullWidth
                        placeholder="Company name in English"
                      />
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <TextField
                        label="ЕИК"
                        value={formData.eik}
                        onChange={(e) => handleInputChange('eik', e.target.value.replace(/\D/g, ''))}
                        fullWidth
                        required
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
                        onChange={(e) => handleInputChange('vatNumber', e.target.value.toUpperCase())}
                        fullWidth
                        error={!!errors.vatNumber}
                        helperText={errors.vatNumber || 'Опционален (BG + 9-10 цифри)'}
                        placeholder="BG123456789"
                        InputProps={{
                          startAdornment: formData.isVatRegistered && <Chip label="ДДС регистрирана" size="small" color="success" />
                        }}
                      />
                    </Box>
                  </Box>

                  <Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.isVatRegistered}
                          onChange={(e) => handleInputChange('isVatRegistered', e.target.checked)}
                          color="primary"
                        />
                      }
                      label="Фирмата е регистрирана по ДДС"
                    />
                  </Box>

                  {formData.isVatRegistered && (
                    <Box sx={{ maxWidth: 300 }}>
                      <TextField
                        label="Дата на ДДС регистрация"
                        type="date"
                        value={formData.taxRegistrationDate}
                        onChange={(e) => handleInputChange('taxRegistrationDate', e.target.value)}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                      />
                    </Box>
                  )}

                  <Box>
                    <TextField
                      label="Адрес"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      fullWidth
                      multiline
                      rows={2}
                      placeholder="Пълен адрес на фирмата"
                    />
                  </Box>
                </Box>
              </Box>

              <Divider />

              {/* Contact Information */}
              <Box>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <PhoneIcon color="primary" />
                  Контактна информация
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <TextField
                        label="Телефон"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        fullWidth
                        placeholder="+359 888 123 456"
                      />
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <TextField
                        label="Email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        fullWidth
                        type="email"
                        error={!!errors.email}
                        helperText={errors.email}
                        placeholder="info@company.com"
                      />
                    </Box>
                  </Box>

                  <Box>
                    <TextField
                      label="Уебсайт"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      fullWidth
                      error={!!errors.website}
                      helperText={errors.website}
                      placeholder="https://company.com"
                    />
                  </Box>
                </Box>
              </Box>

              <Divider />


              {/* Invoice Settings */}
              <Box>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <ReceiptIcon color="primary" />
                  Настройки за фактури
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ maxWidth: 300 }}>
                    <TextField
                      label="Съставител на фактури"
                      value={formData.compiledBy}
                      onChange={(e) => handleInputChange('compiledBy', e.target.value)}
                      fullWidth
                      helperText="Името, което ще се показва в полето 'Съставил'"
                      placeholder="Иван Иванов"
                    />
                  </Box>

                  <Box sx={{ maxWidth: 300 }}>
                    <TextField
                      label="Срок за плащане по подразбиране (дни)"
                      type="number"
                      value={formData.defaultPaymentTerms}
                      onChange={(e) => handleInputChange('defaultPaymentTerms', parseInt(e.target.value) || 0)}
                      fullWidth
                      error={!!errors.defaultPaymentTerms}
                      helperText={errors.defaultPaymentTerms}
                      inputProps={{ min: 0 }}
                    />
                  </Box>

                  <Box>
                    <TextField
                      label="Долен колонтитул за фактури"
                      value={formData.invoiceFooter}
                      onChange={(e) => handleInputChange('invoiceFooter', e.target.value)}
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="Текст който се показва в долната част на фактурите"
                    />
                  </Box>

                  <Box>
                    <TextField
                      label="Footer for English invoices"
                      value={formData.invoiceFooterEn}
                      onChange={(e) => handleInputChange('invoiceFooterEn', e.target.value)}
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="Footer text for English invoices"
                    />
                  </Box>
                </Box>
              </Box>

              {loading && <LinearProgress />}

              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={loading}
                >
                  Запази промените
                </Button>
              </Stack>
            </Stack>
          </form>
        </CardContent>
      </Card>
      
      <SuccessNotification
        open={showSuccessNotification}
        onClose={() => setShowSuccessNotification(false)}
        message="Данните за фирмата са актуализирани успешно!"
      />
    </Box>
  );
};

export default Company;