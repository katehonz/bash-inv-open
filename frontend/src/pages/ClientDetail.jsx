import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  Chip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Paper,
  Avatar,
  InputAdornment,
  Fab,
  Collapse,
  DialogContentText,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Language as WebsiteIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
} from '@mui/icons-material';
import { GET_CLIENT_BY_ID, GET_CLIENT_DOCUMENTS_COUNT } from '../graphql/queries';
import { DELETE_CLIENT } from '../graphql/mutations';
import { ClientType } from '../types';

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data, loading, error } = useQuery(GET_CLIENT_BY_ID, {
    variables: { id },
    skip: !id,
  });

  const { data: documentsData, loading: documentsLoading } = useQuery(GET_CLIENT_DOCUMENTS_COUNT, {
    variables: { clientId: id },
    skip: !id,
  });

  const [deleteClient, { loading: deleting }] = useMutation(DELETE_CLIENT, {
    onCompleted: () => {
      navigate('/clients');
    },
    onError: (error) => {
      console.error('Error deleting client:', error);
    },
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Грешка при зареждане на клиента: {error.message}
        </Alert>
      </Box>
    );
  }

  if (!data?.client) {
    return (
      <Box p={3}>
        <Alert severity="warning">
          Клиентът не е намерен
        </Alert>
      </Box>
    );
  }

  const client = data.client;

  const getClientTypeColor = (type) => {
    return type === ClientType.B2B ? 'primary' : 'secondary';
  };

  const getClientTypeIcon = (type) => {
    return type === ClientType.B2B ? <BusinessIcon /> : <PersonIcon />;
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!id) return;
    
    try {
      await deleteClient({
        variables: { id },
      });
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const canDeleteClient = () => {
    return !documentsLoading && documentsData && !documentsData.clientDocumentsCount?.hasDocuments;
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/clients')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          {client.name}
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteClick}
            disabled={!canDeleteClient() || deleting}
          >
            Изтрий
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/clients/${id}/edit`)}
          >
            Редактиране
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={3}>
        {/* Основна информация */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Основна информация
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Име
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {client.name}
                  </Typography>
                </Grid>

                {client.nameEn && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Име на английски
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {client.nameEn}
                    </Typography>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Адрес
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {client.address || 'Не е посочен'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    ДДС номер
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {client.vatNumber || 'Няма'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    ЕИК
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {client.eik || 'Няма'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Статус и тип */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Статус и тип
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Тип клиент
                  </Typography>
                  <Chip
                    icon={getClientTypeIcon(client.clientType)}
                    label={client.clientType === ClientType.B2B ? 'Бизнес' : 'Потребител'}
                    color={getClientTypeColor(client.clientType)}
                    variant="outlined"
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Статус
                  </Typography>
                  <Chip
                    icon={client.isActive ? <ActiveIcon /> : <InactiveIcon />}
                    label={client.isActive ? 'Активен' : 'Неактивен'}
                    color={client.isActive ? 'success' : 'default'}
                    variant="outlined"
                  />
                </Box>

                {client.isEuVatPayer && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      ЕС ДДС плащец
                    </Typography>
                    <Chip
                      label="Да"
                      color="info"
                      variant="outlined"
                    />
                  </Box>
                )}

                {client.isIndividual && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Физическо лице
                    </Typography>
                    <Chip
                      label="Да"
                      color="secondary"
                      variant="outlined"
                    />
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Контактна информация */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Контактна информация
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Stack spacing={2}>
                {client.email && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon color="action" />
                    <Typography variant="body1">
                      {client.email}
                    </Typography>
                  </Box>
                )}

                {client.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon color="action" />
                    <Typography variant="body1">
                      {client.phone}
                    </Typography>
                  </Box>
                )}

                {client.website && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WebsiteIcon color="action" />
                    <Typography variant="body1">
                      {client.website}
                    </Typography>
                  </Box>
                )}

                {!client.email && !client.phone && !client.website && (
                  <Typography variant="body2" color="text.secondary">
                    Няма налична контактна информация
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Търговски условия */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Търговски условия
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Условия за плащане
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {client.paymentTerms || 'Не са посочени'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Кредитен лимит
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {client.creditLimit ? `${client.creditLimit} лв.` : 'Не е посочен'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Отстъпка (%)
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {client.discountPercent ? `${client.discountPercent}%` : '0%'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Бележки */}
        {client.notes && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Бележки
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {client.notes}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Системна информация */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Системна информация
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Създаден на: {new Date(client.createdAt).toLocaleString('bg-BG')}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Последна промяна: {new Date(client.updatedAt).toLocaleString('bg-BG')}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Изтриване на клиент
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            {!canDeleteClient() ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Този клиент не може да бъде изтрит, защото има издадени документи.
                {documentsData?.clientDocumentsCount?.totalDocuments && (
                  <> Общо документи: {documentsData.clientDocumentsCount.totalDocuments}</>
                )}
              </Alert>
            ) : (
              <>
                Сигурни ли сте, че искате да изтриете клиента <strong>{client.name}</strong>?
                <br />
                Това действие не може да бъде отменено.
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleting}>
            Отказ
          </Button>
          {canDeleteClient() && (
            <Button
              onClick={handleDeleteConfirm}
              color="error"
              variant="contained"
              disabled={deleting}
              startIcon={deleting ? <CircularProgress size={16} /> : <DeleteIcon />}
            >
              {deleting ? 'Изтриване...' : 'Изтрий'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClientDetail;
