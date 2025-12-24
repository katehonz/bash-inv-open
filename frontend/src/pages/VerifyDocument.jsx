import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  Grid,
} from '@mui/material';
import {
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { useLazyQuery } from '@apollo/client';
import { VERIFY_DOCUMENT } from '../graphql/queries';

const documentTypeLabels = {
  INVOICE: 'Фактура',
  CREDIT_NOTE: 'Кредитно известие',
  DEBIT_NOTE: 'Дебитно известие',
  PROFORMA: 'Проформа',
};

// Замяна на кирилски букви с латински (често се случва при копиране)
const cyrillicToLatin = (str) => {
  const map = {
    'а': 'a', 'А': 'A',
    'в': 'b', 'В': 'B',
    'с': 'c', 'С': 'C',
    'е': 'e', 'Е': 'E',
    'о': 'o', 'О': 'O',
    'р': 'p', 'Р': 'P',
    'х': 'x', 'Х': 'X',
  };
  return str.split('').map(char => map[char] || char).join('');
};

const VerifyDocument = () => {
  const [uuid, setUuid] = useState('');
  const [searched, setSearched] = useState(false);

  const [verifyDocument, { loading, data, error }] = useLazyQuery(VERIFY_DOCUMENT, {
    fetchPolicy: 'network-only',
  });

  const handleUuidChange = (e) => {
    // Автоматично заменяме кирилски букви с латински
    const cleanedUuid = cyrillicToLatin(e.target.value);
    setUuid(cleanedUuid);
  };

  const handleVerify = (e) => {
    e.preventDefault();
    if (uuid.trim()) {
      setSearched(true);
      verifyDocument({ variables: { uuid: uuid.trim() } });
    }
  };

  const document = data?.verifyDocument;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        p: 3,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 600,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <ReceiptIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />

        <Typography variant="h4" gutterBottom>
          Валидатор на документи
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Въведете цифровия идентификатор (UUID) от документа, за да проверите неговата автентичност.
        </Typography>

        <form onSubmit={handleVerify}>
          <TextField
            fullWidth
            label="Цифров идентификатор (UUID)"
            value={uuid}
            onChange={handleUuidChange}
            placeholder="напр. a1b2c3d4-e5f6-7890-abcd-ef1234567890"
            sx={{ mb: 2 }}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
            disabled={loading || !uuid.trim()}
            fullWidth
          >
            {loading ? 'Проверка...' : 'Провери документа'}
          </Button>
        </form>

        {error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            Грешка при проверката: {error.message}
          </Alert>
        )}

        {searched && !loading && !error && !document && (
          <Alert
            severity="error"
            icon={<CancelIcon />}
            sx={{ mt: 3 }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              Документът не е намерен
            </Typography>
            <Typography variant="body2">
              Не съществува документ с този идентификатор. Проверете дали сте въвели правилно UUID.
            </Typography>
          </Alert>
        )}

        {document && (
          <Card sx={{ mt: 3, textAlign: 'left' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircleIcon sx={{ color: 'success.main', fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h6" color="success.main">
                    Документът е валиден
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Този документ е автентичен и е издаден от нашата система.
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Тип документ</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {documentTypeLabels[document.documentType] || document.documentType}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Номер</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {document.documentNumber}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Дата на издаване</Typography>
                  <Typography variant="body1">
                    {new Date(document.issueDate).toLocaleDateString('bg-BG')}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Сума</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {document.totalAmountWithVat.toFixed(2)} {document.currencyCode}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Издател</Typography>
                  <Typography variant="body1">{document.companyName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    ЕИК: {document.companyEik}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Получател</Typography>
                  <Typography variant="body1">{document.clientName}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        <Button
          variant="text"
          href="/login"
          sx={{ mt: 3 }}
        >
          Към входа на системата
        </Button>
      </Paper>
    </Box>
  );
};

export default VerifyDocument;
