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
  Alert,
  Chip,
  Stack,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Numbers as NumbersIcon,
  Assignment as TaxIcon,
  AssignmentTurnedIn as NonTaxIcon,
} from '@mui/icons-material';
import { useQuery, useMutation } from '@apollo/client';
import { GET_DOCUMENT_SEQUENCES } from '../graphql/queries';
import { RESET_SEQUENCE, INITIALIZE_COMPANY_SEQUENCES } from '../graphql/mutations';
import { SequenceType } from '../types';

const SEQUENCE_TYPE_OPTIONS = [
  { 
    value: SequenceType.TAX_DOCUMENT, 
    label: 'Данъчни документи',
    description: 'Фактури, кредитни и дебитни известия',
    icon: <TaxIcon color="primary" />
  },
  { 
    value: SequenceType.NON_TAX_DOCUMENT, 
    label: 'Неданъчни документи',
    description: 'Проформа фактури',
    icon: <NonTaxIcon color="secondary" />
  },
];

const DocumentSequencesTab = ({ companyId }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSequence, setEditingSequence] = useState(null);
  const [newStartNumber, setNewStartNumber] = useState(1);
  const [selectedSequenceType, setSelectedSequenceType] = useState(SequenceType.TAX_DOCUMENT);
  const [errors, setErrors] = useState({});

  const { data, loading, error, refetch } = useQuery(GET_DOCUMENT_SEQUENCES, {
    variables: { companyId },
  });

  const [resetSequence] = useMutation(RESET_SEQUENCE, {
    onCompleted: () => {
      refetch();
      handleCloseDialog();
    },
    onError: (error) => {
      console.error('Error resetting sequence:', error);
      setErrors({ general: 'Грешка при актуализиране на поредния номер' });
    },
  });

  const [initializeSequences] = useMutation(INITIALIZE_COMPANY_SEQUENCES, {
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      console.error('Error initializing sequences:', error);
    },
  });

  const sequences = data?.documentSequences || [];

  const handleOpenDialog = (sequence) => {
    if (sequence) {
      setEditingSequence(sequence);
      setNewStartNumber(parseInt(sequence.currentNumber) + 1);
      setSelectedSequenceType(sequence.sequenceType);
    } else {
      setEditingSequence(null);
      setNewStartNumber(1);
      setSelectedSequenceType(SequenceType.TAX_DOCUMENT);
    }
    setDialogOpen(true);
    setErrors({});
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingSequence(null);
    setNewStartNumber(1);
    setSelectedSequenceType(SequenceType.TAX_DOCUMENT);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (!newStartNumber || newStartNumber < 1) {
      newErrors.newStartNumber = 'Поредният номер трябва да бъде поне 1';
    }

    if (editingSequence && newStartNumber <= parseInt(editingSequence.currentNumber)) {
      newErrors.newStartNumber = `Новият номер трябва да бъде по-голям от текущия (${editingSequence.currentNumber})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await resetSequence({
        variables: {
          companyId,
          sequenceType: editingSequence?.sequenceType || selectedSequenceType,
          newStartNumber: newStartNumber - 1, // Backend expects the current number, not the next
        },
      });
    } catch (err) {
      console.error('Error saving sequence:', err);
      setErrors({ general: 'Грешка при запазване на промените' });
    }
  };

  const handleInitializeSequences = () => {
    initializeSequences({
      variables: { companyId },
    });
  };

  const getSequenceTypeInfo = (sequenceType) => {
    return SEQUENCE_TYPE_OPTIONS.find(option => option.value === sequenceType);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('bg-BG');
  };

  const formatNumber = (numberString) => {
    return numberString.padStart(10, '0');
  };

  if (loading) return <Typography>Зареждане...</Typography>;
  if (error) return <Alert severity="error">Грешка: {error.message}</Alert>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NumbersIcon color="primary" />
          Серийни номера на документи
        </Typography>
        <Stack direction="row" spacing={1}>
          {sequences.length === 0 && (
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleInitializeSequences}
            >
              Инициализирай поредиците
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => handleOpenDialog()}
            disabled={sequences.length === 0}
          >
            Редактирай номерация
          </Button>
        </Stack>
      </Box>

      {sequences.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <NumbersIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Няма конфигурирани поредици
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Инициализирайте поредиците за номериране на документи
            </Typography>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={handleInitializeSequences}
            >
              Инициализирай поредиците
            </Button>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Тип документи</TableCell>
                <TableCell>Текущ номер</TableCell>
                <TableCell>Следващ номер</TableCell>
                <TableCell>Последна актуализация</TableCell>
                <TableCell align="center">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sequences.map((sequence) => {
                const typeInfo = getSequenceTypeInfo(sequence.sequenceType);
                return (
                  <TableRow key={sequence.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {typeInfo?.icon}
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {typeInfo?.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {typeInfo?.description}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace" fontSize="1.1em">
                        {formatNumber(sequence.currentNumber)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace" fontSize="1.1em" color="primary.main" fontWeight="bold">
                        {formatNumber(sequence.nextNumber)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(sequence.lastUpdated)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Редактирай номерация">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(sequence)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingSequence ? 'Редактиране на номерация' : 'Задаване на номерация'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {errors.general && (
              <Alert severity="error">{errors.general}</Alert>
            )}

            {!editingSequence && (
              <FormControl fullWidth>
                <InputLabel>Тип документи</InputLabel>
                <Select
                  value={selectedSequenceType}
                  onChange={(e) => setSelectedSequenceType(e.target.value)}
                  label="Тип документи"
                >
                  {SEQUENCE_TYPE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {option.icon}
                        <Box>
                          <Typography variant="body2">
                            {option.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.description}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {editingSequence && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Тип документи
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  {getSequenceTypeInfo(editingSequence.sequenceType)?.icon}
                  <Box>
                    <Typography variant="body2">
                      {getSequenceTypeInfo(editingSequence.sequenceType)?.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {getSequenceTypeInfo(editingSequence.sequenceType)?.description}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Текущ номер
                    </Typography>
                    <Typography variant="h6" fontFamily="monospace">
                      {formatNumber(editingSequence.currentNumber)}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Следващ номер
                    </Typography>
                    <Typography variant="h6" fontFamily="monospace" color="primary.main">
                      {formatNumber(editingSequence.nextNumber)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}

            <TextField
              label="Нов стартов номер"
              type="number"
              value={newStartNumber}
              onChange={(e) => setNewStartNumber(parseInt(e.target.value) || 1)}
              fullWidth
              required
              error={!!errors.newStartNumber}
              helperText={errors.newStartNumber || 'Новата номерация ще започне от този номер'}
              inputProps={{ min: 1 }}
            />

            <Alert severity="info">
              <Typography variant="body2">
                <strong>Внимание:</strong> Промяната на номерацията ще повлияе на всички нови документи от този тип.
                Препоръчваме да правите промени само при нужда.
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отказ</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editingSequence ? 'Актуализирай' : 'Задай'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentSequencesTab;