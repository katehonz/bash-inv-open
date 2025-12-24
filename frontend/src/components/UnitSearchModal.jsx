import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  List, ListItem, ListItemText, ListItemButton, Typography, Box,
  CircularProgress, IconButton, InputAdornment, Chip, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import {
  Search as SearchIcon, Close as CloseIcon,
  Straighten as StraightenIcon
} from '@mui/icons-material';
import { useQuery, gql } from '@apollo/client';

// GraphQL заявки за мерни единици
const SEARCH_UNITS_OF_MEASURE = gql`
  query SearchUnitsOfMeasure($search: String!) {
    searchUnitsOfMeasure(search: $search) {
      code
      name
      nameEn
      symbol
      category
    }
  }
`;

const ALL_UNITS_OF_MEASURE = gql`
  query AllUnitsOfMeasure {
    allUnitsOfMeasure {
      code
      name
      nameEn
      symbol
      category
    }
  }
`;

const UNIT_CATEGORIES = gql`
  query UnitCategories {
    unitCategories
  }
`;

// Превод на категориите на български
const CATEGORY_TRANSLATIONS = {
  'UNIT': 'Единици',
  'MASS': 'Маса',
  'LENGTH': 'Дължина',
  'AREA': 'Площ',
  'VOLUME': 'Обем',
  'TIME': 'Време',
  'PACKAGING': 'Опаковки',
  'ELECTRICAL': 'Електричество',
  'INFORMATION': 'Информация',
  'TEMPERATURE': 'Температура',
  'PRESSURE': 'Налягане',
  'FREQUENCY': 'Честота',
  'SPEED': 'Скорост',
  'PERCENT': 'Процент',
  'SERVICE': 'Услуги',
  'MISCELLANEOUS': 'Други'
};

export const UnitSearchModal = ({
  open,
  onClose,
  onUnitSelected,
  currentUnit
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [viewMode, setViewMode] = useState('search'); // 'search' | 'table'

  // Заявка за търсене
  const { data: searchData, loading: searchLoading } = useQuery(SEARCH_UNITS_OF_MEASURE, {
    variables: { search: searchTerm },
    skip: searchTerm.length < 1
  });

  // Заявка за всички мерни единици
  const { data: allData, loading: allLoading } = useQuery(ALL_UNITS_OF_MEASURE, {
    skip: searchTerm.length > 0
  });

  // Заявка за категории
  const { data: categoriesData } = useQuery(UNIT_CATEGORIES);

  // Изчистваме търсенето когато модалът се затваря
  useEffect(() => {
    if (!open) {
      setSearchTerm('');
      setSelectedCategory('ALL');
    }
  }, [open]);

  // Определяне на данните за показване
  const units = searchTerm.length > 0
    ? (searchData?.searchUnitsOfMeasure || [])
    : (allData?.allUnitsOfMeasure || []);

  // Филтриране по категория
  const filteredUnits = selectedCategory === 'ALL'
    ? units
    : units.filter(u => u.category === selectedCategory);

  // Групиране по категория за табличен изглед
  const groupedUnits = filteredUnits.reduce((acc, unit) => {
    const cat = unit.category || 'MISCELLANEOUS';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(unit);
    return acc;
  }, {});

  const loading = searchLoading || allLoading;
  const categories = categoriesData?.unitCategories || [];

  const handleUnitSelect = (unit) => {
    onUnitSelected(unit);
    onClose();
    setSearchTerm('');
  };

  const handleClose = () => {
    onClose();
    setSearchTerm('');
    setSelectedCategory('ALL');
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px', maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StraightenIcon color="primary" />
            <Typography variant="h6">
              Мерни единици (UN/ECE Rec 20)
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Търсете по код, име на български или английски
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {/* Лента за търсене */}
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Търсене... (напр. 'кг', 'kilogram', 'KGM')"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {/* Табове за категории */}
        <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label="Всички"
            color={selectedCategory === 'ALL' ? 'primary' : 'default'}
            onClick={() => setSelectedCategory('ALL')}
            variant={selectedCategory === 'ALL' ? 'filled' : 'outlined'}
          />
          {categories.map(cat => (
            <Chip
              key={cat}
              label={CATEGORY_TRANSLATIONS[cat] || cat}
              color={selectedCategory === cat ? 'primary' : 'default'}
              onClick={() => setSelectedCategory(cat)}
              variant={selectedCategory === cat ? 'filled' : 'outlined'}
              size="small"
            />
          ))}
        </Box>

        {/* Резултати */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ maxHeight: '400px' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', width: '80px' }}>Код</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Име (БГ)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Name (EN)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '80px' }}>Символ</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '120px' }}>Категория</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUnits.length > 0 ? (
                  filteredUnits.map((unit) => (
                    <TableRow
                      key={unit.code}
                      hover
                      selected={currentUnit === unit.code}
                      onClick={() => handleUnitSelect(unit)}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'primary.50'
                        },
                        ...(currentUnit === unit.code && {
                          backgroundColor: 'primary.100'
                        })
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
                          {unit.code}
                        </Typography>
                      </TableCell>
                      <TableCell>{unit.name}</TableCell>
                      <TableCell>{unit.nameEn}</TableCell>
                      <TableCell>
                        <Chip label={unit.symbol || '-'} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={CATEGORY_TRANSLATIONS[unit.category] || unit.category}
                          size="small"
                          color="default"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                        {searchTerm
                          ? `Няма намерени мерни единици за "${searchTerm}"`
                          : 'Въведете текст за търсене или изберете категория'
                        }
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Информация за стандарта */}
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            <strong>UN/ECE Recommendation 20</strong> - Международен стандарт за кодове на мерни единици,
            използван в UBL, EDI и други формати за електронен обмен на данни.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
          {currentUnit && `Текуща: ${currentUnit}`}
        </Typography>
        <Button onClick={handleClose} color="secondary">
          Отказ
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UnitSearchModal;
