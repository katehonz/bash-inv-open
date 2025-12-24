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
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Divider,
  Chip,
  Autocomplete,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Calculate as CalculatorIcon,
  Receipt as ReceiptIcon,
  Business as BusinessIcon,
  ShoppingCart as ShoppingCartIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { DocumentType } from '../types';
import { GET_ACTIVE_VAT_RATES } from '../graphql/queries';

interface InvoiceItem {
  id: string;
  articleNumber: string;
  description: string;
  quantity: number;
  unit: string;
  priceWithoutVat: number;
  totalValue: number;
}

interface InvoiceFormData {
  // Header information
  documentType: DocumentType;
  series: string;
  number: string;
  issueDate: string;
  vatDate: string;
  
  // Client information
  clientId: string;
  clientName: string;
  clientBulstat: string;
  clientVatNumber: string;
  clientAddress: string;
  
  // Items
  items: InvoiceItem[];
  
  // Calculations
  subtotalWithoutDiscount: number;
  discountPercent: number;
  discountAmount: number;
  taxableAmount: number;
  vatPercent: number;
  vatAmount: number;
  totalAmount: number;
  
  // Additional
  notes: string;
  paymentTerms: number;
  currencyCode: string;
}

const UNITS = [
  'бр.', 'кг.', 'м.', 'м²', 'м³', 'л.', 'час', 'км.', 'т.', 'услуга'
];

const SERIES_OPTIONS = [
  'А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'К'
];

const CreateInvoice: React.FC = () => {
  const navigate = useNavigate();
  
  // Query to get VAT rates
  const { data: vatRatesData, loading: vatRatesLoading } = useQuery(GET_ACTIVE_VAT_RATES);
  
  const [formData, setFormData] = useState<InvoiceFormData>({
    documentType: DocumentType.INVOICE,
    series: 'А',
    number: '',
    issueDate: new Date().toISOString().split('T')[0],
    vatDate: new Date().toISOString().split('T')[0],
    
    clientId: '',
    clientName: '',
    clientBulstat: '',
    clientVatNumber: '',
    clientAddress: '',
    
    items: [{
      id: '1',
      articleNumber: '',
      description: '',
      quantity: 1,
      unit: 'бр.',
      priceWithoutVat: 0,
      totalValue: 0
    }],
    
    subtotalWithoutDiscount: 0,
    discountPercent: 0,
    discountAmount: 0,
    taxableAmount: 0,
    vatPercent: 20,
    vatAmount: 0,
    totalAmount: 0,
    
    notes: '',
    paymentTerms: 14,
    currencyCode: 'BGN'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Function to normalize decimal separators (convert comma to dot)
  const normalizeDecimalInput = (value: string) => {
    return value.replace(',', '.');
  };

  // Function to handle decimal input with both dot and comma support
  const handleDecimalInput = (value: string) => {
    const normalized = normalizeDecimalInput(value);
    return parseFloat(normalized) || 0;
  };

  // Auto-calculate totals when items change
  useEffect(() => {
    calculateTotals();
  }, [formData.items, formData.discountPercent, formData.vatPercent]);

  const calculateTotals = () => {
    const subtotalWithoutDiscount = formData.items.reduce((sum, item) => sum + item.totalValue, 0);
    const discountAmount = (subtotalWithoutDiscount * formData.discountPercent) / 100;
    const taxableAmount = subtotalWithoutDiscount - discountAmount;
    const vatAmount = (taxableAmount * formData.vatPercent) / 100;
    const totalAmount = taxableAmount + vatAmount;

    setFormData(prev => ({
      ...prev,
      subtotalWithoutDiscount,
      discountAmount,
      taxableAmount,
      vatAmount,
      totalAmount
    }));
  };

  const handleInputChange = (field: keyof InvoiceFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };
    
    // Auto-calculate total value for this item
    if (field === 'quantity' || field === 'priceWithoutVat') {
      newItems[index].totalValue = newItems[index].quantity * newItems[index].priceWithoutVat;
    }
    
    setFormData(prev => ({
      ...prev,
      items: newItems
    }));
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      articleNumber: '',
      description: '',
      quantity: 1,
      unit: 'бр.',
      priceWithoutVat: 0,
      totalValue: 0
    };
    
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        items: newItems
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // TODO: Implement invoice creation
      console.log('Creating invoice:', formData);
      // await createInvoice(formData);
      navigate('/invoices');
    } catch (error) {
      console.error('Error creating invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Нова фактура
      </Typography>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Stack spacing={4}>
              
              {/* Header Information */}
              <Box>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <ReceiptIcon color="primary" />
                  Заглавна информация
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <FormLabel component="legend">Тип документ</FormLabel>
                    <RadioGroup
                      row
                      value={formData.documentType}
                      onChange={(e) => handleInputChange('documentType', e.target.value as DocumentType)}
                    >
                      <FormControlLabel value={DocumentType.PROFORMA} control={<Radio />} label="Проформа" />
                      <FormControlLabel value={DocumentType.INVOICE} control={<Radio />} label="Фактура" />
                      <FormControlLabel value={DocumentType.DEBIT_NOTE} control={<Radio />} label="Дебитно известие" />
                      <FormControlLabel value={DocumentType.CREDIT_NOTE} control={<Radio />} label="Кредитно известие" />
                    </RadioGroup>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                    <Box sx={{ minWidth: 120 }}>
                      <FormControl fullWidth>
                        <InputLabel>Серия</InputLabel>
                        <Select
                          value={formData.series}
                          label="Серия"
                          onChange={(e) => handleInputChange('series', e.target.value)}
                        >
                          {SERIES_OPTIONS.map(series => (
                            <MenuItem key={series} value={series}>{series}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <TextField
                        label="Номер"
                        value={formData.number}
                        onChange={(e) => handleInputChange('number', e.target.value)}
                        fullWidth
                        placeholder="Автоматично генериран"
                      />
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <TextField
                        label="Дата на издаване"
                        type="date"
                        value={formData.issueDate}
                        onChange={(e) => handleInputChange('issueDate', e.target.value)}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                      />
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <TextField
                        label="Дата на данъчно събитие"
                        type="date"
                        value={formData.vatDate}
                        onChange={(e) => handleInputChange('vatDate', e.target.value)}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                      />
                    </Box>
                  </Box>
                </Box>
              </Box>

              <Divider />

              {/* Client Information */}
              <Box>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <BusinessIcon color="primary" />
                  Информация за клиент
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                    <Box sx={{ flex: 2 }}>
                      <TextField
                        label="Име на клиент"
                        value={formData.clientName}
                        onChange={(e) => handleInputChange('clientName', e.target.value)}
                        fullWidth
                        required
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <TextField
                        label="БУЛСТАТ/ЕИК"
                        value={formData.clientBulstat}
                        onChange={(e) => handleInputChange('clientBulstat', e.target.value)}
                        fullWidth
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <TextField
                        label="ДДС номер"
                        value={formData.clientVatNumber}
                        onChange={(e) => handleInputChange('clientVatNumber', e.target.value)}
                        fullWidth
                      />
                    </Box>
                  </Box>


                  <Box>
                    <TextField
                      label="Адрес"
                      value={formData.clientAddress}
                      onChange={(e) => handleInputChange('clientAddress', e.target.value)}
                      fullWidth
                      multiline
                      rows={2}
                    />
                  </Box>

                </Box>
              </Box>

              <Divider />

              {/* Products/Services Table */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ShoppingCartIcon color="primary" />
                    Артикули/Услуги
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={addItem}
                    size="small"
                  >
                    Добави ред
                  </Button>
                </Box>

                <TableContainer component={Paper} elevation={1}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Артикул</TableCell>
                        <TableCell>Описание</TableCell>
                        <TableCell width="100px">Количество</TableCell>
                        <TableCell width="100px">Единица</TableCell>
                        <TableCell width="120px">Цена без ДДС</TableCell>
                        <TableCell width="120px">Стойност</TableCell>
                        <TableCell width="60px">Действия</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formData.items.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <TextField
                              value={item.articleNumber}
                              onChange={(e) => handleItemChange(index, 'articleNumber', e.target.value)}
                              size="small"
                              fullWidth
                              placeholder="Каталожен №"
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              value={item.description}
                              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                              size="small"
                              fullWidth
                              placeholder="Описание на артикул/услуга"
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', handleDecimalInput(e.target.value))}
                              size="small"
                              fullWidth
                              inputProps={{ min: 0, step: 0.01 }}
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
                            <FormControl fullWidth size="small">
                              <Select
                                value={item.unit}
                                onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                              >
                                {UNITS.map(unit => (
                                  <MenuItem key={unit} value={unit}>{unit}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              value={item.priceWithoutVat}
                              onChange={(e) => handleItemChange(index, 'priceWithoutVat', handleDecimalInput(e.target.value))}
                              size="small"
                              fullWidth
                              inputProps={{ min: 0, step: 0.01 }}
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
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {item.totalValue.toFixed(2)} лв.
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <IconButton
                              onClick={() => removeItem(index)}
                              disabled={formData.items.length === 1}
                              color="error"
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              <Divider />

              {/* Calculations */}
              <Box>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <CalculatorIcon color="primary" />
                  Изчисления
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 400, marginLeft: 'auto' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography>Сума без отстъпка:</Typography>
                    <Typography fontWeight="bold">{formData.subtotalWithoutDiscount.toFixed(2)} лв.</Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                    <Typography>Отстъпка:</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TextField
                        type="number"
                        value={formData.discountPercent}
                        onChange={(e) => handleInputChange('discountPercent', handleDecimalInput(e.target.value))}
                        size="small"
                        sx={{
                          width: 80,
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
                        inputProps={{ min: 0, max: 100, step: 0.01 }}
                      />
                      <Typography>%</Typography>
                      <Typography fontWeight="bold">{formData.discountAmount.toFixed(2)} лв.</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography>Данъчна основа:</Typography>
                    <Typography fontWeight="bold">{formData.taxableAmount.toFixed(2)} лв.</Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                    <Typography>ДДС ставка:</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>ДДС ставка</InputLabel>
                        <Select
                          value={formData.vatPercent}
                          label="ДДС ставка"
                          onChange={(e) => handleInputChange('vatPercent', parseFloat(String(e.target.value)) || 0)}
                          disabled={vatRatesLoading}
                        >
                          {vatRatesData?.activeVatRates?.map((rate: any) => (
                            <MenuItem key={rate.id} value={rate.rateValue}>
                              {rate.formattedRate}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Typography fontWeight="bold">{formData.vatAmount.toFixed(2)} лв.</Typography>
                    </Box>
                  </Box>

                  <Divider />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Крайна сума:</Typography>
                    <Typography variant="h6" color="primary" fontWeight="bold">
                      {formData.totalAmount.toFixed(2)} лв.
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Divider />

              {/* Additional Information */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Допълнителна информация
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Забележки"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Допълнителна информация към фактурата"
                  />
                  
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <TextField
                        label="Срок за плащане (дни)"
                        type="number"
                        value={formData.paymentTerms}
                        onChange={(e) => handleInputChange('paymentTerms', parseInt(e.target.value) || 0)}
                        fullWidth
                        inputProps={{ min: 0 }}
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
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <FormControl fullWidth>
                        <InputLabel>Валута</InputLabel>
                        <Select
                          value={formData.currencyCode}
                          label="Валута"
                          onChange={(e) => handleInputChange('currencyCode', e.target.value)}
                        >
                          <MenuItem value="BGN">BGN (Български лев)</MenuItem>
                          <MenuItem value="EUR">EUR (Евро)</MenuItem>
                          <MenuItem value="USD">USD (Долар)</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {loading && <LinearProgress />}

              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  type="button"
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={() => navigate('/invoices')}
                >
                  Отказ
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={loading}
                >
                  Създай {formData.documentType === DocumentType.PROFORMA ? 'проформа' : 'фактура'}
                </Button>
              </Stack>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CreateInvoice;