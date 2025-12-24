import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Alert,
  Chip,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { useQuery, useMutation } from '@apollo/client';
import { 
  GET_PAYMENT_METHODS_BY_COMPANY 
} from '../graphql/queries';
import {
  CREATE_PAYMENT_METHOD,
  UPDATE_PAYMENT_METHOD,
  SET_DEFAULT_PAYMENT_METHOD,
  ACTIVATE_PAYMENT_METHOD,
  DEACTIVATE_PAYMENT_METHOD,
} from '../graphql/mutations';

const PaymentMethodsTab = ({ companyId }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    methodCode: '',
    requiresBankAccount: false,
    sortOrder: 0,
    description: '',
    isDefault: false,
  });
  const [errors, setErrors] = useState({});

  const { data, loading, error, refetch } = useQuery(GET_PAYMENT_METHODS_BY_COMPANY, {
    variables: { companyId },
  });

  const [createPaymentMethod] = useMutation(CREATE_PAYMENT_METHOD, {
    onCompleted: () => {
      refetch();
      handleCloseDialog();
    },
  });

  const [updatePaymentMethod] = useMutation(UPDATE_PAYMENT_METHOD, {
    onCompleted: () => {
      refetch();
      handleCloseDialog();
    },
  });

  const [setDefaultPaymentMethod] = useMutation(SET_DEFAULT_PAYMENT_METHOD, {
    onCompleted: () => refetch(),
  });

  const [activatePaymentMethod] = useMutation(ACTIVATE_PAYMENT_METHOD, {
    onCompleted: () => refetch(),
  });

  const [deactivatePaymentMethod] = useMutation(DEACTIVATE_PAYMENT_METHOD, {
    onCompleted: () => refetch(),
  });

  const paymentMethods = data?.paymentMethodsByCompany || [];

  const handleOpenDialog = (method) => {
    if (method) {
      setEditingMethod(method);
      setFormData({
        name: method.name,
        nameEn: method.nameEn || '',
        methodCode: method.methodCode,
        requiresBankAccount: method.requiresBankAccount,
        sortOrder: method.sortOrder || 0,
        description: method.description || '',
        isDefault: method.isDefault,
      });
    } else {
      setEditingMethod(null);
      setFormData({
        name: '',
        nameEn: '',
        methodCode: '',
        requiresBankAccount: false,
        sortOrder: 0,
        description: '',
        isDefault: false,
      });
    }
    setDialogOpen(true);
    setErrors({});
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingMethod(null);
    setFormData({});
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Наименованието е задължително';
    }

    if (!formData.methodCode?.trim()) {
      newErrors.methodCode = 'Кодът на метода е задължителен';
    } else {
      // Check for duplicate method codes
      const existingMethod = paymentMethods.find(
        (pm) => 
          pm.methodCode === formData.methodCode && 
          pm.id !== editingMethod?.id
      );
      if (existingMethod) {
        newErrors.methodCode = 'Този код вече се използва от друг метод на плащане';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (editingMethod) {
        await updatePaymentMethod({
          variables: {
            input: {
              id: editingMethod.id,
              ...formData,
            },
          },
        });
      } else {
        await createPaymentMethod({
          variables: {
            input: {
              ...formData,
              companyId,
            },
          },
        });
      }
    } catch (err) {
      console.error('Error saving payment method:', err);
    }
  };

  const handleSetDefault = (methodId) => {
    setDefaultPaymentMethod({
      variables: { id: methodId },
    });
  };

  const handleToggleActive = (method) => {
    if (method.isActive) {
      deactivatePaymentMethod({
        variables: { id: method.id },
      });
    } else {
      activatePaymentMethod({
        variables: { id: method.id },
      });
    }
  };

  const getMethodCodeColor = (methodCode) => {
    switch (methodCode) {
      case 'CASH': return 'success';
      case 'BANK_TRANSFER': return 'primary';
      case 'CARD': return 'secondary';
      case 'PAYPAL': return 'info';
      case 'PAYBG': return 'warning';
      default: return 'default';
    }
  };

  if (loading) return <Typography>Зареждане...</Typography>;
  if (error) return <Alert severity="error">Грешка: {error.message}</Alert>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PaymentIcon color="primary" />
          Методи на плащане
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Добави метод
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Наименование</TableCell>
              <TableCell>Код</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Изисква банкова сметка</TableCell>
              <TableCell>Описание</TableCell>
              <TableCell align="center">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paymentMethods.map((method) => (
              <TableRow key={method.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {method.name}
                    {method.isDefault && (
                      <Chip
                        label="По подразбиране"
                        size="small"
                        color="primary"
                        icon={<StarIcon />}
                      />
                    )}
                  </Box>
                  {method.nameEn && (
                    <Typography variant="caption" color="text.secondary">
                      {method.nameEn}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={method.methodCode}
                    size="small"
                    color={getMethodCodeColor(method.methodCode)}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={method.isActive ? 'Активен' : 'Неактивен'}
                    size="small"
                    color={method.isActive ? 'success' : 'default'}
                    variant={method.isActive ? 'filled' : 'outlined'}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={method.requiresBankAccount ? 'Да' : 'Не'}
                    size="small"
                    color={method.requiresBankAccount ? 'primary' : 'default'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {method.description || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <Tooltip title={method.isDefault ? 'По подразбиране' : 'Задай по подразбиране'}>
                      <IconButton
                        size="small"
                        onClick={() => handleSetDefault(method.id)}
                        disabled={method.isDefault}
                      >
                        {method.isDefault ? <StarIcon color="primary" /> : <StarBorderIcon />}
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title={method.isActive ? 'Деактивирай' : 'Активирай'}>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleActive(method)}
                      >
                        {method.isActive ? (
                          <ToggleOnIcon color="success" />
                        ) : (
                          <ToggleOffIcon color="disabled" />
                        )}
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Редактирай">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(method)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {paymentMethods.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="text.secondary">
                    Няма добавени методи на плащане
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingMethod ? 'Редактиране на метод на плащане' : 'Нов метод на плащане'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Наименование"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
                error={!!errors.name}
                helperText={errors.name}
              />
              <TextField
                label="Наименование (EN)"
                value={formData.nameEn || ''}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                fullWidth
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Код на метода"
                value={formData.methodCode || ''}
                onChange={(e) => setFormData({ ...formData, methodCode: e.target.value.toUpperCase() })}
                fullWidth
                required
                error={!!errors.methodCode}
                helperText={errors.methodCode || 'Уникален код за метода (напр. CASH, BANK_TRANSFER)'}
              />
              <TextField
                label="Ред на сортиране"
                type="number"
                value={formData.sortOrder || 0}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                fullWidth
              />
            </Box>

            <TextField
              label="Описание"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.requiresBankAccount || false}
                    onChange={(e) => setFormData({ ...formData, requiresBankAccount: e.target.checked })}
                  />
                }
                label="Изисква банкова сметка"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isDefault || false}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  />
                }
                label="По подразбиране"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отказ</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editingMethod ? 'Запази' : 'Създай'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentMethodsTab;