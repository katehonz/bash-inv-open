import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  MenuItem,
  Stack,
  Alert,
  LinearProgress,
} from '@mui/material';
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { useMutation, useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { CREATE_DOCUMENT } from '../graphql/mutations';
import { GET_CLIENTS } from '../graphql/queries';
import { DocumentType } from '../types';
import dayjs from 'dayjs';
import SuccessNotification from '../components/SuccessNotification';
import '../styles/CleanNumberInput.css';
import { useCompany } from '../context/CompanyContext';

const CreateDocument = () => {
  const navigate = useNavigate();
  const { activeCompanyId } = useCompany();
  const [formData, setFormData] = useState({
    documentType: DocumentType.INVOICE,
    issueDate: dayjs().format('YYYY-MM-DD'),
    vatDate: dayjs().format('YYYY-MM-DD'),
    dueDate: dayjs().add(30, 'days').format('YYYY-MM-DD'),
    totalAmount: 0,
    clientId: '',
    companyId: activeCompanyId,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);

  const { data: clientsData, loading: clientsLoading } = useQuery(GET_CLIENTS, {
    variables: { companyId: formData.companyId },
  });

  const [createDocument, { loading, error }] = useMutation(CREATE_DOCUMENT, {
    onCompleted: (data) => {
      setShowSuccessNotification(true);
      // Small delay to show notification before navigation
      setTimeout(() => {
        navigate(`/documents/${data.createDocument.id}`);
      }, 1000);
    },
    onError: (error) => {
      console.error('Error creating document:', error);
    },
  });

  const handleInputChange = (field: string, value: string | number) => {
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
    const newErrors: Record<string, string> = {};

    if (!formData.clientId) {
      newErrors.clientId = 'Клиентът е задължителен';
    }
    if (!formData.issueDate) {
      newErrors.issueDate = 'Датата на издаване е задължителна';
    }
    if (!formData.dueDate) {
      newErrors.dueDate = 'Срокът е задължителен';
    }
    if (formData.totalAmount <= 0) {
      newErrors.totalAmount = 'Сумата трябва да е положителна';
    }

    // VAT дата е задължителна за данъчни документи
    const isTaxDocument = [DocumentType.INVOICE, DocumentType.CREDIT_NOTE, DocumentType.DEBIT_NOTE].includes(formData.documentType);
    if (isTaxDocument && !formData.vatDate) {
      newErrors.vatDate = 'VAT датата е задължителна за данъчни документи';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await createDocument({
        variables: {
          input: {
            documentType: formData.documentType,
            issueDate: formData.issueDate,
            vatDate: formData.vatDate || null,
            dueDate: formData.dueDate,
            totalAmount: formData.totalAmount,
            companyId: formData.companyId,
            clientId: formData.clientId,
          },
        },
      });
    } catch (err) {
      console.error('Error submitting form:', err);
    }
  };

  const getDocumentTypeLabel = (type: DocumentType) => {
    switch (type) {
      case DocumentType.INVOICE:
        return 'Фактура';
      case DocumentType.CREDIT_NOTE:
        return 'Кредитно известие';
      case DocumentType.DEBIT_NOTE:
        return 'Дебитно известие';
      case DocumentType.PROFORMA:
        return 'Проформа фактура';
      default:
        return type;
    }
  };

  const isTaxDocument = [DocumentType.INVOICE, DocumentType.CREDIT_NOTE, DocumentType.DEBIT_NOTE].includes(formData.documentType);
  const clients = clientsData?.clients || [];

  return (
    <Box>
      <Typography variant="h4" gutterBottom className="clean-title">
        Нов документ
      </Typography>

      <Card className="clean-card">
        <CardContent>
          <form onSubmit={handleSubmit} className="clean-form">
            <Stack spacing={3} className="clean-stack">
              {error && (
                <Alert severity="error">
                  Грешка при създаване на документа: {error.message}
                </Alert>
              )}

              <TextField
                select
                label="Тип документ"
                value={formData.documentType}
                onChange={(e) => handleInputChange('documentType', e.target.value)}
                fullWidth
                required
              >
                <MenuItem value={DocumentType.INVOICE}>
                  {getDocumentTypeLabel(DocumentType.INVOICE)}
                </MenuItem>
                <MenuItem value={DocumentType.CREDIT_NOTE}>
                  {getDocumentTypeLabel(DocumentType.CREDIT_NOTE)}
                </MenuItem>
                <MenuItem value={DocumentType.DEBIT_NOTE}>
                  {getDocumentTypeLabel(DocumentType.DEBIT_NOTE)}
                </MenuItem>
                <MenuItem value={DocumentType.PROFORMA}>
                  {getDocumentTypeLabel(DocumentType.PROFORMA)}
                </MenuItem>
              </TextField>

              <TextField
                select
                label="Клиент"
                value={formData.clientId}
                onChange={(e) => handleInputChange('clientId', e.target.value)}
                fullWidth
                required
                error={!!errors.clientId}
                helperText={errors.clientId}
                disabled={clientsLoading}
              >
                {clients.map((client: any) => (
                  <MenuItem key={client.id} value={client.id}>
                    {client.name}
                  </MenuItem>
                ))}
              </TextField>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  type="date"
                  label="Дата на издаване"
                  value={formData.issueDate}
                  onChange={(e) => handleInputChange('issueDate', e.target.value)}
                  fullWidth
                  required
                  error={!!errors.issueDate}
                  helperText={errors.issueDate}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />

                {isTaxDocument && (
                  <TextField
                    type="date"
                    label="VAT дата"
                    value={formData.vatDate}
                    onChange={(e) => handleInputChange('vatDate', e.target.value)}
                    fullWidth
                    required={isTaxDocument}
                    error={!!errors.vatDate}
                    helperText={errors.vatDate || 'Задължителна за данъчни документи'}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                )}

                <TextField
                  type="date"
                  label="Срок за плащане"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  fullWidth
                  required
                  error={!!errors.dueDate}
                  helperText={errors.dueDate}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Stack>

              <TextField
                type="number"
                label="Обща сума"
                value={formData.totalAmount}
                onChange={(e) => handleInputChange('totalAmount', parseFloat(e.target.value) || 0)}
                fullWidth
                required
                error={!!errors.totalAmount}
                helperText={errors.totalAmount}
                className="clean-number-input"
                InputProps={{
                  endAdornment: 'лв.',
                }}
                inputProps={{
                  min: 0,
                  step: 0.01,
                }}
              />

              {loading && <LinearProgress />}

              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  type="button"
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={() => navigate('/documents')}
                  className="clean-button"
                >
                  Отказ
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={loading}
                  className="clean-button"
                >
                  Създай документ
                </Button>
              </Stack>
            </Stack>
          </form>
        </CardContent>
      </Card>
      
      <SuccessNotification
        open={showSuccessNotification}
        onClose={() => setShowSuccessNotification(false)}
        message="Документът е създаден успешно!"
      />
    </Box>
  );
};

export default CreateDocument;