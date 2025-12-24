import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useLazyQuery, useMutation } from '@apollo/client';
import {
  Box, Typography, Card, CardContent, Stack, TextField, RadioGroup, FormControlLabel,
  Radio, Divider, Autocomplete, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, IconButton, FormControl, InputLabel,
  Select, MenuItem, Grid, CircularProgress, Alert, LinearProgress, Switch
} from '@mui/material';
import {
  Receipt as ReceiptIcon, Business as BusinessIcon, ShoppingCart as ShoppingCartIcon,
  Add as AddIcon, Delete as DeleteIcon, Calculate as CalculateIcon, Notes as NotesIcon,
  Cancel as CancelIcon, Save as SaveIcon, Search as SearchIcon, Close as CloseIcon
} from '@mui/icons-material';

import { useCompany } from '../context/CompanyContext';
import { ItemSearchModal } from '../components/ItemSearchModal';
import { ClientSearchModal } from '../components/ClientSearchModal';
import VatExemptionAutocomplete from '../components/VatExemptionAutocomplete';
import {
  GET_CLIENTS, GET_DOCUMENT_BY_ID, GET_ACTIVE_VAT_RATES,
  GET_LATEST_EXCHANGE_RATES, GET_ACTIVE_ITEMS_BY_COMPANY, GET_ACTIVE_CURRENCIES,
  GET_PAYMENT_METHODS_BY_COMPANY, GET_BANK_ACCOUNTS_BY_COMPANY,
  GET_ALL_VAT_EXEMPTION_REASONS, GET_DOCUMENTS_BY_COMPANY, GET_NOMENCLATURES
} from '../graphql/queries';
import { UPDATE_DOCUMENT } from '../graphql/mutations';

// Constants
const DocumentType = {
  INVOICE: 'INVOICE',
  PROFORMA: 'PROFORMA',
  CREDIT_NOTE: 'CREDIT_NOTE',
  DEBIT_NOTE: 'DEBIT_NOTE',
};

const EditDocument = () => {
  const navigate = useNavigate();
  const { id: documentId } = useParams();
  const { activeCompanyId } = useCompany();

  const [loading, setLoading] = useState(true);
  const [isItemSearchModalOpen, setIsItemSearchModalOpen] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState(null);
  const [newItemNotification, setNewItemNotification] = useState(null);
  const [isClientSearchModalOpen, setIsClientSearchModalOpen] = useState(false);
  const [pricesIncludeVat, setPricesIncludeVat] = useState(false);

  const [formData, setFormData] = useState({
    documentType: DocumentType.INVOICE,
    number: '',
    issueDate: new Date().toISOString().split('T')[0],
    vatDate: new Date().toISOString().split('T')[0],
    clientId: '',
    clientName: '',
    clientBulstat: '',
    clientVatNumber: '',
    clientAddress: '',
    items: [
      {
        id: Date.now().toString(),
        itemId: null, // Real item ID from database
        articleNumber: '',
        description: '',
        quantity: 1,
        unit: 'бр.',
        priceWithoutVat: 0,
        priceWithVat: 0,
        totalValue: 0,
      },
    ],
    subtotalWithoutDiscount: 0,
    discountPercent: 0,
    discountAmount: 0,
    taxableAmount: 0,
    vatPercent: 20,
    vatAmount: 0,
    totalAmountWithVat: 0,
    totalAmountWithVatInEUR: 0,
    notes: '',
    paymentTerms: 15,
    currencyCode: 'EUR',
    paymentMethodId: '',
    bankAccountId: '',
    vatExemptionReasonId: '',
  });

  // GraphQL Queries
  const { data: documentData, loading: documentLoading, error: documentError } = useQuery(GET_DOCUMENT_BY_ID, {
    variables: { id: documentId },
    onCompleted: (data) => {
      const doc = data.documentById;
      setFormData({
        documentType: doc.documentType,
        number: doc.documentNumber,
        issueDate: new Date(doc.issueDate).toISOString().split('T')[0],
        vatDate: doc.vatDate ? new Date(doc.vatDate).toISOString().split('T')[0] : new Date(doc.issueDate).toISOString().split('T')[0],
        clientId: doc.client.id,
        clientName: doc.client.name,
        clientBulstat: doc.client.eik,
        clientVatNumber: doc.client.vatNumber,
        clientAddress: doc.client.address,
        items: (doc.documentItems || []).map(item => {
          const vatRate = item.vatRate / 100;
          const priceWithVat = Math.round(item.unitPrice * (1 + vatRate) * 100) / 100;
          return {
            id: item.id,
            itemId: item.item?.id || null,
            articleNumber: item.item?.itemNumber || '',
            description: item.itemDescription || item.item?.name || '',
            quantity: item.quantity,
            unit: item.item?.unitOfMeasure || 'бр.',
            priceWithoutVat: item.unitPrice,
            priceWithVat: priceWithVat,
            totalValue: item.quantity * item.unitPrice,
          };
        }),
        subtotalWithoutDiscount: doc.subtotalAmount || 0, // This will be recalculated
        discountPercent: 0, // Assuming discount is not stored directly
        discountAmount: 0,
        taxableAmount: doc.subtotalAmount || 0, // This will be recalculated
        vatPercent: doc.documentItems?.length > 0 ? doc.documentItems[0].vatRate : 20,
        vatAmount: doc.vatAmount || 0,
        totalAmountWithVat: doc.totalAmountWithVat || 0,
        totalAmountWithVatInEUR: 0, // This will be recalculated
        notes: doc.notes || '',
        paymentTerms: 15, // Assuming this is not stored directly
        currencyCode: doc.currencyCode || 'EUR',
        paymentMethodId: doc.paymentMethod?.id || '',
        bankAccountId: doc.bankAccount?.id || '',
        // vatExemptionReason is on documentItems level, get from first item if exists
        vatExemptionReasonId: (doc.documentItems?.length > 0 && doc.documentItems[0].vatExemptionReason?.id) || '',
      });
      setLoading(false);
    }
  });

  const { data: clientsData, loading: clientsLoading, refetch: refetchClients } = useQuery(GET_CLIENTS, {
    variables: { companyId: activeCompanyId },
    skip: !activeCompanyId,
  });

  const { data: vatRatesData, loading: vatRatesLoading } = useQuery(GET_ACTIVE_VAT_RATES);
  const { data: exchangeRatesData } = useQuery(GET_LATEST_EXCHANGE_RATES);
  const { data: itemsData, loading: itemsLoading, refetch: refetchItems } = useQuery(GET_ACTIVE_ITEMS_BY_COMPANY, {
    variables: { companyId: activeCompanyId },
    skip: !activeCompanyId,
  });
  const { data: currenciesData, loading: currenciesLoading } = useQuery(GET_ACTIVE_CURRENCIES);
  const { data: paymentMethodsData, loading: paymentMethodsLoading } = useQuery(GET_PAYMENT_METHODS_BY_COMPANY, {
    variables: { companyId: activeCompanyId },
    skip: !activeCompanyId,
  });
  const { data: bankAccountsData, loading: bankAccountsLoading } = useQuery(GET_BANK_ACCOUNTS_BY_COMPANY, {
    variables: { companyId: activeCompanyId },
    skip: !activeCompanyId,
  });
  const { data: vatExemptionReasonsData, loading: vatExemptionReasonsLoading } = useQuery(GET_ALL_VAT_EXEMPTION_REASONS);
  const { data: nomenclaturesData } = useQuery(GET_NOMENCLATURES);

  // Helper to get unit name from code
  const getUnitName = (code) => {
    const unit = nomenclaturesData?.allUnitsOfMeasure?.find(u => u.code === code);
    return unit ? `${unit.name} (${unit.symbol})` : code;
  };

  const [updateDocument, { loading: updateDocumentLoading, error: updateDocumentError }] = useMutation(
    UPDATE_DOCUMENT,
    {
      refetchQueries: [
        {
          query: GET_DOCUMENTS_BY_COMPANY,
          variables: { companyId: activeCompanyId }
        }
      ],
      awaitRefetchQueries: true
    }
  );

  const [exchangeRates, setExchangeRates] = useState({});
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const clients = useMemo(() => clientsData?.clientsByCompany || [], [clientsData]);

  // Effects
  useEffect(() => {
    if (exchangeRatesData?.latestExchangeRates) {
      const rates = exchangeRatesData.latestExchangeRates.reduce((acc, rate) => {
        acc[rate.currency.code] = rate.rate;
        return acc;
      }, {});
      rates['EUR'] = 1;
      setExchangeRates(rates);
    }
  }, [exchangeRatesData]);

  // Sync selectedPaymentMethod with full data from paymentMethodsData
  useEffect(() => {
    if (formData.paymentMethodId && paymentMethodsData?.paymentMethodsByCompany) {
      const fullPaymentMethod = paymentMethodsData.paymentMethodsByCompany.find(
        pm => pm.id === formData.paymentMethodId
      );
      if (fullPaymentMethod) {
        setSelectedPaymentMethod(fullPaymentMethod);
      }
    }
  }, [formData.paymentMethodId, paymentMethodsData]);

  // Обработка на новодобавен артикул от AddItemModal
  const handleItemAdded = (newItem) => {
    // Обновяваме списъка с артикули
    refetchItems();
    
    // Показваме съобщение за успешно добавяне
    setNewItemNotification(`Нов артикул "${newItem.name}" беше добавен успешно! Изберете го от списъка.`);
    
    // Скриваме известието след 3 секунди
    setTimeout(() => {
      setNewItemNotification(null);
    }, 3000);
  };

  const calculateTotals = useCallback(() => {
    const subtotalWithoutDiscount = formData.items.reduce((sum, item) => sum + item.totalValue, 0);
    const discountAmount = (subtotalWithoutDiscount * formData.discountPercent) / 100;
    const taxableAmount = subtotalWithoutDiscount - discountAmount;
    const vatAmount = (taxableAmount * formData.vatPercent) / 100;
    const totalAmountWithVat = taxableAmount + vatAmount;

    let totalAmountWithVatInEUR = totalAmountWithVat;
    let conversionRate;

    if (formData.currencyCode !== 'EUR') {
      const rate = exchangeRates[formData.currencyCode];
      if (rate && rate !== 0) {
        conversionRate = rate;
        // ЕЦБ курс: 1 EUR = X единици валута, затова делим за да получим EUR
        totalAmountWithVatInEUR = totalAmountWithVat / conversionRate;
      }
    }

    setFormData(prev => ({
      ...prev,
      subtotalWithoutDiscount,
      discountAmount,
      taxableAmount,
      vatAmount,
      totalAmountWithVat,
      totalAmountWithVatInEUR,
      conversionRate
    }));
  }, [formData.items, formData.discountPercent, formData.vatPercent, formData.currencyCode, exchangeRates]);

  useEffect(() => {
    calculateTotals();
  }, [calculateTotals]);

  // Handlers
  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      // Clear VAT exemption reason if VAT is not 0%
      if (field === 'vatPercent' && value !== 0) {
        newData.vatExemptionReasonId = '';
      }
      return newData;
    });
  };

  const handleDecimalInput = (value) => {
    return parseFloat(value.replace(',', '.')) || 0;
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'quantity' || field === 'priceWithoutVat' || field === 'priceWithVat') {
      const vatRate = formData.vatPercent / 100;

      if (field === 'priceWithVat' && pricesIncludeVat) {
        // Calculate price without VAT from price with VAT
        const priceWithVat = value;
        const priceWithoutVat = priceWithVat / (1 + vatRate);
        newItems[index].priceWithoutVat = Math.round(priceWithoutVat * 100) / 100;
        newItems[index].priceWithVat = priceWithVat;
      } else if (field === 'priceWithoutVat' && !pricesIncludeVat) {
        // Calculate price with VAT from price without VAT
        const priceWithoutVat = value;
        const priceWithVat = priceWithoutVat * (1 + vatRate);
        newItems[index].priceWithoutVat = priceWithoutVat;
        newItems[index].priceWithVat = Math.round(priceWithVat * 100) / 100;
      }

      newItems[index].totalValue = newItems[index].quantity * newItems[index].priceWithoutVat;
    }

    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    const newItem = {
      id: Date.now().toString(),
      itemId: null, // Real item ID from database
      articleNumber: '',
      description: '',
      quantity: 0,
      unit: 'бр.',
      priceWithoutVat: 0,
      priceWithVat: 0,
      totalValue: 0
    };
    setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, items: newItems }));
    }
  };

  const openItemSearchModal = (index) => {
    setCurrentItemIndex(index);
    setIsItemSearchModalOpen(true);
  };

  const handleClientSelected = (client) => {
    setFormData(prev => ({
      ...prev,
      clientId: client.id,
      clientName: client.name,
      clientBulstat: client.eik || '',
      clientVatNumber: client.vatNumber || '',
      clientAddress: client.address || '',
    }));
    setIsClientSearchModalOpen(false);
  };

  const handleItemSelected = (item) => {
    if (currentItemIndex !== null) {
      const newItems = [...formData.items];
      const currentItem = newItems[currentItemIndex];

      const priceWithoutVat = item.unitPrice || 0;
      const vatRate = formData.vatPercent / 100;
      const priceWithVat = Math.round(priceWithoutVat * (1 + vatRate) * 100) / 100;

      const updatedItem = {
        ...currentItem,
        itemId: item.id, // Real item ID from database
        articleNumber: item.itemNumber || '',
        description: item.name,
        priceWithoutVat: priceWithoutVat,
        priceWithVat: priceWithVat,
        unit: item.unitOfMeasure || 'бр.',
        // Преизчисляваме totalValue, ако количеството вече е въведено
        totalValue: currentItem.quantity * priceWithoutVat,
      };

      newItems[currentItemIndex] = updatedItem;

      setFormData(prev => ({ ...prev, items: newItems }));

      // Затваряме модала и изчистваме индекса
      setIsItemSearchModalOpen(false);
      setCurrentItemIndex(null);
    }
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Validate that all items have been selected from catalog
      const unselectedItems = formData.items.filter(item => !item.itemId);
      if (unselectedItems.length > 0) {
        alert("Грешка: Моля, изберете артикул от каталога за всеки ред.");
        setLoading(false);
        return;
      }

      // Prepare document items for the mutation
      const items = formData.items.map(item => ({
        itemId: item.itemId,
        quantity: item.quantity,
        unitPrice: item.priceWithoutVat,
        vatRate: formData.vatPercent,
        itemDescription: item.description || item.articleNumber,
        ...(formData.vatExemptionReasonId && { vatExemptionReasonId: formData.vatExemptionReasonId })
      }));

      // Prepare the input for the mutation
      const input = {
        documentType: formData.documentType,
        issueDate: formData.issueDate,
        vatDate: formData.vatDate,
        dueDate: new Date(new Date(formData.issueDate).getTime() + formData.paymentTerms * 24 * 60 * 60 * 1000)
          .toISOString().split('T')[0],
        companyId: activeCompanyId,
        clientId: formData.clientId,
        items: items,
        currencyCode: formData.currencyCode,
        ...(formData.notes && { notes: formData.notes }),
        ...(formData.paymentMethodId && { paymentMethodId: formData.paymentMethodId }),
        ...(formData.bankAccountId && { bankAccountId: formData.bankAccountId })
      };

      console.log('Updating document with input:', JSON.stringify(input, null, 2));

      const { data } = await updateDocument({
        variables: { id: documentId, input }
      });

      console.log('Document updated successfully:', data.updateDocument);
      navigate('/documents');
    } catch (error) {
      console.error('Error updating document:', error);
      if (error.message.includes("Item not found")) {
        alert("Грешка: Един или повече от артикулите не е избран от каталога. Моля, изберете артикул за всеки ред.");
      } else {
        alert(`Грешка при обновяване на документ: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <CircularProgress />;
  if (documentError) return <Alert severity="error">Error loading document: {documentError.message}</Alert>;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      {/* Известие за нов артикул */}
      {newItemNotification && (
        <Alert 
          severity="info" 
          sx={{ 
            position: 'fixed', 
            top: 80, 
            right: 20, 
            zIndex: 1300,
            minWidth: 300,
            maxWidth: 500
          }}
          onClose={() => setNewItemNotification(null)}
        >
          {newItemNotification}
        </Alert>
      )}

      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        📄 Редакция на документ
      </Typography>

      <Card elevation={3}>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Stack spacing={4}>
              
              {/* Header Information */}
              <Box>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <ReceiptIcon color="primary" />
                  Заглавна информация
                </Typography>
                <Stack spacing={2}>
                  <RadioGroup row value={formData.documentType} onChange={(e) => handleInputChange('documentType', e.target.value)}>
                    <FormControlLabel value={DocumentType.PROFORMA} control={<Radio />} label="Проформа" />
                    <FormControlLabel value={DocumentType.INVOICE} control={<Radio />} label="Фактура" />
                    <FormControlLabel value={DocumentType.DEBIT_NOTE} control={<Radio />} label="Дебитно известие" />
                    <FormControlLabel value={DocumentType.CREDIT_NOTE} control={<Radio />} label="Кредитно известие" />
                  </RadioGroup>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField label="Номер на фактура" value={formData.number} fullWidth disabled placeholder="Генерира се автоматично" />
                    <TextField label="Дата на издаване" type="date" value={formData.issueDate} onChange={(e) => handleInputChange('issueDate', e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
                    <TextField label="Дата на данъчно събитие" type="date" value={formData.vatDate} onChange={(e) => handleInputChange('vatDate', e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
                  </Stack>
                </Stack>
              </Box>

              <Divider />

              {/* Client Information */}
              <Box>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <BusinessIcon color="primary" />
                  Информация за клиент
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => setIsClientSearchModalOpen(true)}
                    sx={{ 
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                      color: formData.clientName ? 'text.primary' : 'text.secondary',
                      borderStyle: formData.clientName ? 'solid' : 'dashed',
                      textTransform: 'none'
                    }}
                  >
                    {formData.clientName 
                      ? `${formData.clientBulstat ? `${formData.clientBulstat} - ` : ''}${formData.clientName}`
                      : 'Изберете клиент - кликни тук'
                    }
                  </Button>
                  {formData.clientName && (
                    <IconButton 
                      size="small" 
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          clientId: '',
                          clientName: '',
                          clientBulstat: '',
                          clientVatNumber: '',
                          clientAddress: ''
                        }));
                      }}
                      sx={{ color: 'text.secondary' }}
                    >
                      <CloseIcon />
                    </IconButton>
                  )}
                </Box>
                <Stack spacing={2} mt={2}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField label="Име на клиент" value={formData.clientName} fullWidth required InputProps={{ readOnly: true }} />
                    <TextField label="БУЛСТАТ/ЕИК" value={formData.clientBulstat} fullWidth InputProps={{ readOnly: true }} />
                    <TextField label="ДДС номер" value={formData.clientVatNumber} fullWidth InputProps={{ readOnly: true }} />
                  </Stack>
                  <TextField label="Адрес" value={formData.clientAddress} fullWidth multiline rows={2} InputProps={{ readOnly: true }} />
                </Stack>
              </Box>

              <Divider />

              {/* Currency & VAT Selection */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>Настройки за плащане и ДДС</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Валута</InputLabel>
                      <Select
                        value={formData.currencyCode}
                        label="Валута"
                        onChange={(e) => handleInputChange('currencyCode', e.target.value)}
                        disabled={currenciesLoading}
                      >
                        {currenciesData?.activeCurrencies?.map((currency) => (
                          <MenuItem key={currency.code} value={currency.code}>
                            {currency.code} ({currency.name})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                     <FormControl fullWidth>
                        <InputLabel>ДДС ставка</InputLabel>
                        <Select value={formData.vatPercent} label="ДДС ставка" onChange={(e) => handleInputChange('vatPercent', Number(e.target.value))} disabled={vatRatesLoading}>
                          {vatRatesData?.activeVatRates.map((rate) => (
                            <MenuItem key={rate.id} value={rate.rateValue}>
                              {rate.rateValue}% ({rate.rateName})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={pricesIncludeVat}
                          onChange={(e) => setPricesIncludeVat(e.target.checked)}
                          color="primary"
                        />
                      }
                      label="Цените са с включено ДДС"
                    />
                  </Grid>
                  {formData.vatPercent === 0 && (
                    <Grid item xs={12} md={3}>
                      <VatExemptionAutocomplete
                        value={formData.vatExemptionReasonId}
                        onChange={(reasonId) => handleInputChange('vatExemptionReasonId', reasonId)}
                        disabled={vatExemptionReasonsLoading}
                        required={formData.vatPercent === 0}
                        label="Основание за 0% ДДС"
                      />
                    </Grid>
                  )}
                </Grid>
              </Box>

              <Divider />

              {/* Products/Services Table */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ShoppingCartIcon color="primary" />
                    Артикули/Услуги
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={pricesIncludeVat}
                          onChange={(e) => setPricesIncludeVat(e.target.checked)}
                          color="primary"
                        />
                      }
                      label="Цени с ДДС"
                      sx={{ mr: 2 }}
                    />
                    <Button variant="contained" startIcon={<AddIcon />} onClick={addItem} size="small" color="success">
                      Добави ред
                    </Button>
                  </Box>
                </Box>
                <TableContainer component={Paper} elevation={2}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'primary.light' }}>
                        <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>Артикул/Описание</TableCell>
                        <TableCell width="100px" sx={{ fontWeight: 'bold' }}>Количество</TableCell>
                        <TableCell width="100px" sx={{ fontWeight: 'bold' }}>Единица</TableCell>
                        <TableCell width="120px" sx={{ fontWeight: 'bold' }}>
                          {pricesIncludeVat ? 'Цена с ДДС' : 'Цена без ДДС'}
                        </TableCell>
                        <TableCell width="120px" sx={{ fontWeight: 'bold' }}>Стойност</TableCell>
                        <TableCell width="60px" sx={{ fontWeight: 'bold' }}>Действия</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formData.items.map((item, index) => {
                        const availableItems = itemsData?.activeItemsByCompany || [];
                        const currentItem = availableItems.find(i => i.id === item.itemId) || null;
                        return (
                          <TableRow key={item.id} hover>
                            <TableCell colSpan={2}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Button
                                  variant="outlined"
                                  fullWidth
                                  onClick={() => openItemSearchModal(index)}
                                  sx={{ 
                                    justifyContent: 'flex-start',
                                    textAlign: 'left',
                                    color: currentItem ? 'text.primary' : 'text.secondary',
                                    borderStyle: currentItem ? 'solid' : 'dashed',
                                    textTransform: 'none'
                                  }}
                                >
                                  {currentItem 
                                    ? `${currentItem.itemNumber ? `${currentItem.itemNumber} - ` : ''}${currentItem.name}`
                                    : 'Изберете артикул - кликни тук'
                                  }
                                </Button>
                                {currentItem && (
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      handleItemChange(index, 'itemId', null);
                                      handleItemChange(index, 'articleNumber', '');
                                      handleItemChange(index, 'description', '');
                                      handleItemChange(index, 'priceWithoutVat', 0);
                                      handleItemChange(index, 'unit', 'бр.');
                                    }}
                                    sx={{ color: 'text.secondary' }}
                                  >
                                    <CloseIcon />
                                  </IconButton>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <TextField
                                type="number"
                                value={item.quantity || ''}
                                onChange={(e) => handleItemChange(index, 'quantity', handleDecimalInput(e.target.value))}
                                size="small"
                                fullWidth
                                placeholder="0"
                                inputProps={{
                                  step: 0.01,
                                  style: { MozAppearance: 'textfield' }
                                }}
                                sx={{
                                  '& input[type=number]': {
                                    MozAppearance: 'textfield',
                                  },
                                  '& input[type=number]::-webkit-outer-spin-button': {
                                    WebkitAppearance: 'none',
                                    margin: 0,
                                  },
                                  '& input[type=number]::-webkit-inner-spin-button': {
                                    WebkitAppearance: 'none',
                                    margin: 0,
                                  },
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField value={getUnitName(item.unit)} size="small" fullWidth disabled />
                            </TableCell>
                            <TableCell>
                              <TextField
                                type="number"
                                value={pricesIncludeVat ? (item.priceWithVat || '') : (item.priceWithoutVat || '')}
                                onChange={(e) => handleItemChange(
                                  index,
                                  pricesIncludeVat ? 'priceWithVat' : 'priceWithoutVat',
                                  handleDecimalInput(e.target.value)
                                )}
                                size="small"
                                fullWidth
                                placeholder="0.00"
                                inputProps={{
                                  step: 0.01,
                                  style: { MozAppearance: 'textfield' }
                                }}
                                sx={{
                                  '& input[type=number]': {
                                    MozAppearance: 'textfield',
                                  },
                                  '& input[type=number]::-webkit-outer-spin-button': {
                                    WebkitAppearance: 'none',
                                    margin: 0,
                                  },
                                  '& input[type=number]::-webkit-inner-spin-button': {
                                    WebkitAppearance: 'none',
                                    margin: 0,
                                  },
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                {(item.totalValue || 0).toFixed(2)} {formData.currencyCode}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <IconButton onClick={() => removeItem(index)} disabled={formData.items.length === 1} color="error" size="small">
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              <Divider />

              {/* Calculations */}
              <Box>
                 <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <CalculateIcon color="primary" />
                  Изчисления
                </Typography>
                <Grid container spacing={2} justifyContent="flex-end">
                  <Grid item xs={12} md={6}>
                    <Stack spacing={1} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography>Сума без отстъпка:</Typography>
                        <Typography>{(formData.subtotalWithoutDiscount || 0).toFixed(2)} {formData.currencyCode}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography>Отстъпка:</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, maxWidth: 200 }}>
                          <TextField 
                            type="number" 
                            value={formData.discountPercent || 0} 
                            onChange={(e) => handleInputChange('discountPercent', handleDecimalInput(e.target.value))} 
                            size="small" 
                            sx={{ 
                              width: 80,
                              '& input[type=number]': { MozAppearance: 'textfield' },
                              '& input[type=number]::-webkit-outer-spin-button': { WebkitAppearance: 'none', margin: 0 },
                              '& input[type=number]::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 },
                            }} 
                            inputProps={{ min: 0, max: 100 }} 
                          />
                          <Typography>%</Typography>
                          <Typography>{(formData.discountAmount || 0).toFixed(2)} {formData.currencyCode}</Typography>
                        </Box>
                      </Box>
                      <Divider />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={{ fontWeight: 'bold' }}>Данъчна основа:</Typography>
                        <Typography sx={{ fontWeight: 'bold' }}>{(formData.taxableAmount || 0).toFixed(2)} {formData.currencyCode}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography>ДДС:</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, maxWidth: 200 }}>
                          <FormControl size="small" sx={{ width: 120 }}>
                            <Select value={formData.vatPercent} onChange={(e) => handleInputChange('vatPercent', Number(e.target.value))} disabled={vatRatesLoading}>
                              {vatRatesData?.activeVatRates.map((rate) => (
                                <MenuItem key={rate.id} value={rate.rateValue}>
                                  {rate.rateValue}%
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <Typography>{(formData.vatAmount || 0).toFixed(2)} {formData.currencyCode}</Typography>
                        </Box>
                      </Box>
                      <Divider />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="h6" color="primary">Обща сума:</Typography>
                        <Typography variant="h6" color="primary">{(formData.totalAmountWithVat || 0).toFixed(2)} {formData.currencyCode}</Typography>
                      </Box>
                      {formData.currencyCode !== 'EUR' && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">Общо в EUR (курс {formData.conversionRate?.toFixed(5)}):</Typography>
                          <Typography variant="body2" color="text.secondary">{(formData.totalAmountWithVatInEUR || 0).toFixed(2)} EUR</Typography>
                        </Box>
                      )}
                    </Stack>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Payment Method and Bank Account */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>Метод на плащане</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Метод на плащане</InputLabel>
                      <Select
                        value={formData.paymentMethodId}
                        label="Метод на плащане"
                        onChange={(e) => {
                          const paymentMethodId = e.target.value;
                          const paymentMethod = paymentMethodsData?.paymentMethodsByCompany.find(pm => pm.id === paymentMethodId);
                          handleInputChange('paymentMethodId', paymentMethodId);
                          setSelectedPaymentMethod(paymentMethod);
                          if (!paymentMethod?.requiresBankAccount) {
                            handleInputChange('bankAccountId', '');
                          }
                        }}
                        disabled={paymentMethodsLoading}
                      >
                        {paymentMethodsData?.paymentMethodsByCompany.map((method) => (
                          <MenuItem key={method.id} value={method.id}>
                            {method.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  {selectedPaymentMethod?.requiresBankAccount && (
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Банкова сметка</InputLabel>
                        <Select
                          value={formData.bankAccountId}
                          label="Банкова сметка"
                          onChange={(e) => handleInputChange('bankAccountId', e.target.value)}
                          disabled={bankAccountsLoading}
                        >
                          {bankAccountsData?.bankAccountsByCompany.filter(ba => ba.isActive).map((account) => (
                            <MenuItem key={account.id} value={account.id}>
                              {account.displayName || account.accountName} ({account.currencyCode})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  )}
                </Grid>
              </Box>

              <Divider />

              {/* Notes and Payment Terms */}
              <Box>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <NotesIcon color="primary" />
                  Допълнителна информация
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <TextField label="Бележки" value={formData.notes} onChange={(e) => handleInputChange('notes', e.target.value)} multiline rows={3} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField 
                      label="Срок за плащане (дни)" 
                      type="number" 
                      value={formData.paymentTerms} 
                      onChange={(e) => handleInputChange('paymentTerms', Number(e.target.value))} 
                      fullWidth 
                      sx={{
                        '& input[type=number]': { MozAppearance: 'textfield' },
                        '& input[type=number]::-webkit-outer-spin-button': { WebkitAppearance: 'none', margin: 0 },
                        '& input[type=number]::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 },
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Actions */}
              <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 4 }}>
                <Button variant="outlined" color="secondary" onClick={() => navigate('/documents')} startIcon={<CancelIcon />}>
                  Отказ
                </Button>
                <Button type="submit" variant="contained" disabled={loading} startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}>
                  Запази промените
                </Button>
              </Stack>
            </Stack>
          </form>
        </CardContent>
      </Card>



      <ItemSearchModal
        open={isItemSearchModalOpen}
        onClose={() => setIsItemSearchModalOpen(false)}
        onItemSelected={handleItemSelected}
        items={itemsData?.activeItemsByCompany || []}
        loading={itemsLoading}
        companyId={activeCompanyId || '1'}
        onItemAdded={refetchItems}
      />

      {isClientSearchModalOpen && (
        <ClientSearchModal
          open={isClientSearchModalOpen}
          onClose={() => setIsClientSearchModalOpen(false)}
          onClientSelected={handleClientSelected}
          onClientAdded={refetchClients}
        />
      )}
    </Box>
  );
};

export default EditDocument;