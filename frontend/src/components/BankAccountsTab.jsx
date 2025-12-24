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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
  AccountBalance as BankIcon,
} from '@mui/icons-material';
import { useQuery, useMutation } from '@apollo/client';
import { 
  GET_BANK_ACCOUNTS_BY_COMPANY 
} from '../graphql/queries';
import {
  CREATE_BANK_ACCOUNT,
  UPDATE_BANK_ACCOUNT,
  SET_DEFAULT_BANK_ACCOUNT,
  ACTIVATE_BANK_ACCOUNT,
  DEACTIVATE_BANK_ACCOUNT,
} from '../graphql/mutations';

const CURRENCY_OPTIONS = [
  { code: 'BGN', name: 'Български лев' },
  { code: 'EUR', name: 'Евро' },
  { code: 'USD', name: 'Американски долар' },
  { code: 'GBP', name: 'Британска лира' },
  { code: 'CHF', name: 'Швейцарски франк' },
];

const BankAccountsTab = ({ companyId }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    bankName: '',
    iban: '',
    bic: '',
    currencyCode: 'BGN',
    accountName: '',
    sortOrder: 0,
    description: '',
    isDefault: false,
  });
  const [errors, setErrors] = useState({});

  const { data, loading, error, refetch } = useQuery(GET_BANK_ACCOUNTS_BY_COMPANY, {
    variables: { companyId },
  });

  const [createBankAccount] = useMutation(CREATE_BANK_ACCOUNT, {
    onCompleted: () => {
      refetch();
      handleCloseDialog();
    },
  });

  const [updateBankAccount] = useMutation(UPDATE_BANK_ACCOUNT, {
    onCompleted: () => {
      refetch();
      handleCloseDialog();
    },
  });

  const [setDefaultBankAccount] = useMutation(SET_DEFAULT_BANK_ACCOUNT, {
    onCompleted: () => refetch(),
  });

  const [activateBankAccount] = useMutation(ACTIVATE_BANK_ACCOUNT, {
    onCompleted: () => refetch(),
  });

  const [deactivateBankAccount] = useMutation(DEACTIVATE_BANK_ACCOUNT, {
    onCompleted: () => refetch(),
  });

  const bankAccounts = data?.bankAccountsByCompany || [];

  const handleOpenDialog = (account) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        bankName: account.bankName,
        iban: account.iban,
        bic: account.bic,
        currencyCode: account.currencyCode,
        accountName: account.accountName || '',
        sortOrder: account.sortOrder || 0,
        description: account.description || '',
        isDefault: account.isDefault,
      });
    } else {
      setEditingAccount(null);
      setFormData({
        bankName: '',
        iban: '',
        bic: '',
        currencyCode: 'BGN',
        accountName: '',
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
    setEditingAccount(null);
    setFormData({});
    setErrors({});
  };

  const validateIban = (iban) => {
    // Basic IBAN validation
    const cleanIban = iban.replace(/\s/g, '').toUpperCase();
    const ibanRegex = /^[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}$/;
    return ibanRegex.test(cleanIban);
  };

  const validateBic = (bic) => {
    // Basic BIC validation
    const cleanBic = bic.replace(/\s/g, '').toUpperCase();
    const bicRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
    return bicRegex.test(cleanBic);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.bankName?.trim()) {
      newErrors.bankName = 'Наименованието на банката е задължително';
    }

    if (!formData.iban?.trim()) {
      newErrors.iban = 'IBAN е задължителен';
    } else if (!validateIban(formData.iban)) {
      newErrors.iban = 'Невалиден IBAN формат';
    } else {
      // Check for duplicate IBAN
      const existingAccount = bankAccounts.find(
        (ba) => 
          ba.iban === formData.iban?.replace(/\s/g, '').toUpperCase() && 
          ba.id !== editingAccount?.id
      );
      if (existingAccount) {
        newErrors.iban = 'Този IBAN вече се използва от друга банкова сметка';
      }
    }

    if (!formData.bic?.trim()) {
      newErrors.bic = 'BIC кодът е задължителен';
    } else if (!validateBic(formData.bic)) {
      newErrors.bic = 'Невалиден BIC формат';
    }

    if (!formData.currencyCode?.trim()) {
      newErrors.currencyCode = 'Валутата е задължителна';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const input = {
        ...formData,
        iban: formData.iban?.replace(/\s/g, '').toUpperCase(),
        bic: formData.bic?.replace(/\s/g, '').toUpperCase(),
      };

      if (editingAccount) {
        await updateBankAccount({
          variables: {
            input: {
              id: editingAccount.id,
              ...input,
            },
          },
        });
      } else {
        await createBankAccount({
          variables: {
            input: {
              ...input,
              companyId,
            },
          },
        });
      }
    } catch (err) {
      console.error('Error saving bank account:', err);
    }
  };

  const handleSetDefault = (accountId) => {
    setDefaultBankAccount({
      variables: { id: accountId },
    });
  };

  const handleToggleActive = (account) => {
    if (account.isActive) {
      deactivateBankAccount({
        variables: { id: account.id },
      });
    } else {
      activateBankAccount({
        variables: { id: account.id },
      });
    }
  };

  const getCurrencyColor = (currencyCode) => {
    switch (currencyCode) {
      case 'BGN': return 'success';
      case 'EUR': return 'primary';
      case 'USD': return 'secondary';
      case 'GBP': return 'info';
      default: return 'default';
    }
  };

  const formatIban = (iban) => {
    return iban.replace(/(.{4})/g, '$1 ').trim();
  };

  if (loading) return <Typography>Зареждане...</Typography>;
  if (error) return <Alert severity="error">Грешка: {error.message}</Alert>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BankIcon color="primary" />
          Банкови сметки
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Добави сметка
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Банка</TableCell>
              <TableCell>IBAN</TableCell>
              <TableCell>BIC</TableCell>
              <TableCell>Валута</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Описание</TableCell>
              <TableCell align="center">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bankAccounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="body2" fontWeight="bold">
                      {account.bankName}
                    </Typography>
                    {account.accountName && (
                      <Typography variant="caption" color="text.secondary">
                        {account.accountName}
                      </Typography>
                    )}
                    {account.isDefault && (
                      <Chip
                        label="По подразбиране"
                        size="small"
                        color="primary"
                        icon={<StarIcon />}
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontFamily="monospace">
                    {formatIban(account.iban)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontFamily="monospace">
                    {account.bic}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={account.currencyCode}
                    size="small"
                    color={getCurrencyColor(account.currencyCode)}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={account.isActive ? 'Активна' : 'Неактивна'}
                    size="small"
                    color={account.isActive ? 'success' : 'default'}
                    variant={account.isActive ? 'filled' : 'outlined'}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {account.description || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <Tooltip title={account.isDefault ? 'По подразбиране' : 'Задай по подразбиране'}>
                      <IconButton
                        size="small"
                        onClick={() => handleSetDefault(account.id)}
                        disabled={account.isDefault}
                      >
                        {account.isDefault ? <StarIcon color="primary" /> : <StarBorderIcon />}
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title={account.isActive ? 'Деактивирай' : 'Активирай'}>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleActive(account)}
                      >
                        {account.isActive ? (
                          <ToggleOnIcon color="success" />
                        ) : (
                          <ToggleOffIcon color="disabled" />
                        )}
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Редактирай">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(account)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {bankAccounts.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary">
                    Няма добавени банкови сметки
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
          {editingAccount ? 'Редактиране на банкова сметка' : 'Нова банкова сметка'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Наименование на банката"
                value={formData.bankName || ''}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                fullWidth
                required
                error={!!errors.bankName}
                helperText={errors.bankName}
                placeholder="Уникредит Булбанк АД"
              />
              <TextField
                label="Име на сметката"
                value={formData.accountName || ''}
                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                fullWidth
                placeholder="Основна сметка BGN"
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="IBAN"
                value={formData.iban || ''}
                onChange={(e) => setFormData({ ...formData, iban: e.target.value.replace(/\s/g, '').toUpperCase() })}
                fullWidth
                required
                error={!!errors.iban}
                helperText={errors.iban}
                placeholder="BG80BNBG96611020345678"
                inputProps={{ style: { fontFamily: 'monospace' } }}
              />
              <TextField
                label="BIC код"
                value={formData.bic || ''}
                onChange={(e) => setFormData({ ...formData, bic: e.target.value.toUpperCase() })}
                fullWidth
                required
                error={!!errors.bic}
                helperText={errors.bic}
                placeholder="UNCRBGSF"
                inputProps={{ style: { fontFamily: 'monospace' } }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth required error={!!errors.currencyCode}>
                <InputLabel>Валута</InputLabel>
                <Select
                  value={formData.currencyCode || 'BGN'}
                  onChange={(e) => setFormData({ ...formData, currencyCode: e.target.value })}
                  label="Валута"
                >
                  {CURRENCY_OPTIONS.map((currency) => (
                    <MenuItem key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
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
              placeholder="Допълнителна информация за сметката"
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отказ</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editingAccount ? 'Запази' : 'Създай'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BankAccountsTab;