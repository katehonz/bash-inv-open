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
  TextField,
  Stack,
  Chip,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Sync as SyncIcon,
} from '@mui/icons-material';
import { useQuery, useApolloClient, useMutation } from '@apollo/client';
import { GET_ALL_CURRENCIES, GET_CURRENCY_SYSTEM_STATUS, GET_LATEST_EXCHANGE_RATES, GET_EXCHANGE_RATES_FOR_DATE } from '../graphql/queries';
import { SYNC_EXCHANGE_RATES, CLEAR_ALL_EXCHANGE_RATES, TOGGLE_CURRENCY_ACTIVE } from '../graphql/mutations';
import Switch from '@mui/material/Switch';

const CurrencyTab = ({ companyId }) => {
  const [lookupDate, setLookupDate] = useState('');
  const [lookupRatesData, setLookupRatesData] = useState(null);
  const [isLookupLoading, setIsLookupLoading] = useState(false);

  // Apollo Client
  const client = useApolloClient();

  // Queries
  const { data: currenciesData, loading: currenciesLoading, refetch: refetchCurrencies } = useQuery(GET_ALL_CURRENCIES);
  const { data: currencyStatusData, loading: currencyStatusLoading, refetch: refetchCurrencyStatus } = useQuery(GET_CURRENCY_SYSTEM_STATUS);
  const { data: exchangeRatesData, loading: exchangeRatesLoading, refetch: refetchExchangeRates } = useQuery(GET_LATEST_EXCHANGE_RATES);

  // Mutations
  const [syncRates, { loading: syncLoading }] = useMutation(SYNC_EXCHANGE_RATES, {
    onCompleted: () => {
      refetchExchangeRates();
      alert('Курсовете са синхронизирани успешно от ЕЦБ');
    },
    onError: (error) => {
      alert('Грешка при синхронизация: ' + error.message);
    }
  });

  const [clearRates, { loading: clearLoading }] = useMutation(CLEAR_ALL_EXCHANGE_RATES, {
    onCompleted: () => {
      refetchExchangeRates();
      setLookupRatesData(null);
      alert('Всички курсове са изтрити успешно');
    },
    onError: (error) => {
      alert('Грешка при изтриване: ' + error.message);
    }
  });

  const handleClearRates = () => {
    if (window.confirm('Сигурни ли сте, че искате да изтриете всички валутни курсове? След това трябва да синхронизирате от ЕЦБ.')) {
      clearRates();
    }
  };

  // Toggle currency active status
  const [toggleCurrency, { loading: toggleLoading }] = useMutation(TOGGLE_CURRENCY_ACTIVE, {
    refetchQueries: [{ query: GET_ALL_CURRENCIES }],
    onError: (error) => {
      alert('Грешка: ' + error.message);
    }
  });

  const handleToggleCurrency = (code) => {
    if (code === 'EUR') {
      alert('EUR е базовата валута и не може да бъде деактивирана');
      return;
    }
    toggleCurrency({ variables: { code } });
  };

  // Function to lookup exchange rates for a specific date
  const handleLookupRates = async () => {
    if (!lookupDate) {
      alert('Моля, изберете дата за справка');
      return;
    }

    setIsLookupLoading(true);
    try {
      const { data } = await client.query({
        query: GET_EXCHANGE_RATES_FOR_DATE,
        variables: { date: lookupDate },
        fetchPolicy: 'network-only'
      });
      setLookupRatesData(data.exchangeRatesForDate);
    } catch (error) {
      console.error('Error fetching exchange rates for date:', error);
      alert('Грешка при зареждане на курсовете за избраната дата');
    } finally {
      setIsLookupLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Управление на валути и курсове
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<DeleteIcon />}
            onClick={handleClearRates}
            disabled={clearLoading}
          >
            {clearLoading ? 'Изтриване...' : 'Изтрий курсовете'}
          </Button>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<SyncIcon />}
            onClick={() => syncRates()}
            disabled={syncLoading}
          >
            {syncLoading ? 'Синхронизиране...' : 'Синхронизирай от ЕЦБ'}
          </Button>
        </Stack>
      </Box>

      {/* Currency System Status */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Системен статус
          </Typography>
          {currencyStatusLoading ? (
            <LinearProgress />
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Еврозона активна
                </Typography>
                <Typography variant="body1">
                  <Chip
                    label={currencyStatusData?.currencySystemStatus?.eurozoneActive ? "Да" : "Не"}
                    color={currencyStatusData?.currencySystemStatus?.eurozoneActive ? "success" : "default"}
                    size="small"
                  />
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Базова валута
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {currencyStatusData?.currencySystemStatus?.baseCurrency || 'BGN'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Валута по подразбиране
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {currencyStatusData?.currencySystemStatus?.defaultCurrency || 'BGN'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Активен провайдър
                </Typography>
                <Typography variant="body1">
                  <Chip
                    label={currencyStatusData?.currencySystemStatus?.activeProvider || 'БНБ'}
                    color="primary"
                    size="small"
                  />
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Курс BGN/EUR
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {currencyStatusData?.currencySystemStatus?.bgnToEurRate || '1.95583'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Дата на прехода
                </Typography>
                <Typography variant="body1">
                  {currencyStatusData?.currencySystemStatus?.transitionDate || '01.01.2026'}
                </Typography>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Latest Exchange Rates */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Последни курсове от ЕЦБ
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Курсовете се актуализират автоматично всеки ден в 16:00 от Европейската централна банка.
            Можете да направите справка по дата с полето по-долу.
          </Alert>
          
          {/* Date Lookup Section */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" fontWeight="bold">
              Справка по дата:
            </Typography>
            <TextField
              label="Изберете дата"
              type="date"
              value={lookupDate}
              onChange={(e) => setLookupDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{ minWidth: 150 }}
            />
            <Button
              variant="contained"
              size="small"
              onClick={handleLookupRates}
              disabled={isLookupLoading || !lookupDate}
              startIcon={isLookupLoading ? <LinearProgress /> : <RefreshIcon />}
            >
              {isLookupLoading ? 'Търсене...' : 'Провери'}
            </Button>
            {lookupRatesData && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setLookupRatesData(null);
                  setLookupDate('');
                }}
                startIcon={<CancelIcon />}
              >
                Покажи последни
              </Button>
            )}
            {lookupRatesData && (
              <Chip
                label={`Намерени ${lookupRatesData.length} курса за ${lookupDate}`}
                color="success"
                size="small"
              />
            )}
          </Box>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Валута</TableCell>
                  <TableCell>Код</TableCell>
                  <TableCell>За 1 EUR</TableCell>
                  <TableCell>Обратен курс (за 1 ед.)</TableCell>
                  <TableCell>Дата</TableCell>
                  <TableCell>Базова валута</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(exchangeRatesLoading || isLookupLoading) ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <LinearProgress />
                    </TableCell>
                  </TableRow>
                ) : (
                  // Show lookup results if available, otherwise show latest rates
                  (lookupRatesData || exchangeRatesData?.latestExchangeRates || []).map((rate) => {
                    const rateValue = parseFloat(rate.rate);
                    const inverseRate = rateValue > 0 ? (1 / rateValue) : 0;
                    return (
                      <TableRow key={rate.id || `${rate.currency?.code}-${rate.rateDate}`}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {rate.currency?.name || rate.currency?.code}
                            {lookupRatesData && (
                              <Chip label="Справка" size="small" color="info" variant="outlined" />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {rate.currency?.code}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold" color="primary">
                            {rateValue.toFixed(6)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold" color="secondary">
                            {inverseRate.toFixed(6)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {rate.rateDate}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={rate.baseCurrency} size="small" color="secondary" />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
                {!exchangeRatesLoading && !isLookupLoading && !lookupRatesData && (!exchangeRatesData?.latestExchangeRates || exchangeRatesData.latestExchangeRates.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Няма налични курсове. Свържете се с администратора за синхронизация.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {!exchangeRatesLoading && !isLookupLoading && lookupRatesData && lookupRatesData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Няма налични курсове за избраната дата ({lookupDate}).
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Available Currencies */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Управление на валути (ЕЦБ)
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Активирайте валутите, с които ще работите. EUR е базовата валута и е винаги активна.
            Само активните валути ще се показват в падащите менюта за избор на валута.
          </Alert>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Код</TableCell>
                  <TableCell>Наименование</TableCell>
                  <TableCell>Символ</TableCell>
                  <TableCell align="center">Активна</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currenciesLoading ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <LinearProgress />
                    </TableCell>
                  </TableRow>
                ) : (
                  (currenciesData?.allCurrencies || []).map((currency) => (
                    <TableRow
                      key={currency.code}
                      sx={{
                        backgroundColor: currency.isActive ? 'inherit' : 'action.hover',
                        opacity: currency.isActive ? 1 : 0.7
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {currency.code}
                        </Typography>
                      </TableCell>
                      <TableCell>{currency.name}</TableCell>
                      <TableCell>{currency.symbol || '-'}</TableCell>
                      <TableCell align="center">
                        <Switch
                          checked={currency.isActive}
                          onChange={() => handleToggleCurrency(currency.code)}
                          disabled={currency.code === 'EUR' || toggleLoading}
                          color="primary"
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {!currenciesLoading && (!currenciesData?.allCurrencies || currenciesData.allCurrencies.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Няма налични валути в базата данни.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CurrencyTab;