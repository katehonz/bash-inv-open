import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  List, ListItem, ListItemText, ListItemButton, Typography, Box,
  CircularProgress, Divider, IconButton, InputAdornment, Alert
} from '@mui/material';
import {
  Search as SearchIcon, Add as AddIcon, Close as CloseIcon,
  ShoppingCart as ShoppingCartIcon
} from '@mui/icons-material';
import { AddItemModal } from './AddItemModal';
import '../styles/CleanNumberInput.css';

export const ItemSearchModal = ({
  open,
  onClose,
  onItemSelected,
  items,
  loading,
  companyId,
  onItemAdded
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);

  // Изчистваме търсенето когато модалът се затваря
  useEffect(() => {
    if (!open) {
      setSearchTerm('');
    }
  }, [open]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredItems(items);
    } else {
      const filtered = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.itemNumber && item.itemNumber.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredItems(filtered);
    }
  }, [searchTerm, items]);

  const handleItemSelect = (item) => {
    onItemSelected(item);
    onClose();
    setSearchTerm('');
  };

  const handleAddNew = () => {
    setIsAddItemModalOpen(true);
  };

  const handleItemAdded = (newItem) => {
    // Затваряме AddItemModal
    setIsAddItemModalOpen(false);
    
    // ERP-подобен поток: оставяме модала отворен и попълваме търсенето
    setSearchTerm(newItem.name);
    
    // Извикваме callback ако е предоставен (за обновяване на списъка)
    if (onItemAdded) {
      onItemAdded(newItem);
    }
  };

  const handleClose = () => {
    onClose();
    setSearchTerm('');
  };

  return (
    <>
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      className="clean-modal"
      PaperProps={{
        sx: { minHeight: '500px', maxHeight: '80vh' }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShoppingCartIcon color="primary" />
            <Typography variant="h6">Търсене на артикул/услуга</Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Въведете име или номер на артикул..."
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

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {filteredItems.length > 0 ? (
              <List sx={{ maxHeight: '300px', overflow: 'auto' }}>
                {filteredItems.map((item) => (
                  <ListItem key={item.id} disablePadding>
                    <ListItemButton
                      onClick={() => handleItemSelect(item)}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                        '&:hover': {
                          borderColor: 'primary.main',
                          backgroundColor: 'primary.50'
                        }
                      }}
                    >
                      <ListItemText
                        primary={
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {item.itemNumber ? `${item.itemNumber} - ${item.name}` : item.name}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {item.unitPrice 
                                ? `Цена: ${item.unitPrice.toFixed(2)} лв./${item.unitOfMeasure || 'бр.'}`
                                : 'Няма зададена цена'
                              }
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  {searchTerm.trim() === '' 
                    ? 'Въведете текст за търсене'
                    : `Няма намерени артикули за "${searchTerm}"`
                  }
                </Typography>
                
                {searchTerm.trim() !== '' && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Не намерихме артикул с това име. Можете да отворите страницата за артикули в нов таб за да добавите нов артикул с всички необходими данни.
                  </Alert>
                )}
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="secondary">
          Отказ
        </Button>
        
        {searchTerm.trim() !== '' && filteredItems.length === 0 && !loading && (
          <Button
            onClick={handleAddNew}
            variant="contained"
            startIcon={<AddIcon />}
            color="success"
          >
Добави нов артикул
          </Button>
        )}
      </DialogActions>
    </Dialog>

    {/* Модал за добавяне на нов артикул */}
    <AddItemModal
      open={isAddItemModalOpen}
      onClose={() => setIsAddItemModalOpen(false)}
      onItemAdded={handleItemAdded}
      initialName={searchTerm}
      companyId={companyId}
    />
    </>
  );
};
