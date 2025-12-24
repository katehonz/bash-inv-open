import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  List,
  ListItem,
  ListItemText,
  Button,
  Box,
  Typography,
  IconButton,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useLazyQuery } from '@apollo/client';
import { SEARCH_CLIENTS } from '../graphql/queries';
import AddClientModalFull from './AddClientModalFull';
import { useCompany } from '../context/CompanyContext';

export const ClientSearchModal = ({
  open,
  onClose,
  onClientSelected,
  onClientAdded,
}) => {
  const { activeCompanyId } = useCompany();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [clients, setClients] = useState([]);

  const [searchClients, { loading }] = useLazyQuery(SEARCH_CLIENTS, {
    onCompleted: (data) => {
      setClients(data.searchClients || []);
    },
    onError: (error) => {
      console.error('Error searching clients:', error);
      setClients([]);
    },
  });

  // Търсене с debounce когато се промени searchTerm
  useEffect(() => {
    if (!open) return;
    
    if (!searchTerm || searchTerm.trim().length < 1) {
      setClients([]);
      return;
    }

    const timer = setTimeout(() => {
      searchClients({
        variables: {
          companyId: activeCompanyId,
          searchTerm: searchTerm.trim()
        }
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, open, searchClients, activeCompanyId]);

  const handleClientSelect = (client) => {
    onClientSelected(client);
    onClose();
    setSearchTerm('');
  };

  const handleClientAdded = (newClient) => {
    setIsAddClientModalOpen(false);
    setSearchTerm(newClient.name); // Попълваме търсенето с името на новия клиент
    if (onClientAdded) {
      onClientAdded(); // Извикваме callback-а
    }
  };

  const handleClose = () => {
    onClose();
    setSearchTerm('');
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Търсене на клиент</Typography>
            <IconButton onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="Търсене по име, ЕИК, ДДС номер или адрес"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Търсене в локалната база данни с клиенти"
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              autoFocus
            />
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
              <Typography variant="body2" sx={{ ml: 2 }}>
                Зареждане на клиенти...
              </Typography>
            </Box>
          ) : (
            <>
              {clients.length > 0 ? (
                <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {clients.map((client) => (
                    <ListItem key={client.id} divider>
                      <ListItemText
                        primary={client.name}
                        secondary={
                          <Box>
                            {client.eik && <Typography variant="body2">ЕИК: {client.eik}</Typography>}
                            {client.vatNumber && <Typography variant="body2">ДДС: {client.vatNumber}</Typography>}
                            {client.address && <Typography variant="body2">Адрес: {client.address}</Typography>}
                          </Box>
                        }
                      />
                      <Button
                        variant="outlined"
                        onClick={() => handleClientSelect(client)}
                        sx={{ ml: 2 }}
                      >
                        Избери
                      </Button>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    {searchTerm ? 'Няма намерени клиенти' : 'Въведете текст за търсене'}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Box sx={{ textAlign: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setIsAddClientModalOpen(true)}
                  size="large"
                >
                  Добави нов клиент
                </Button>
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>

      {isAddClientModalOpen && (
        <AddClientModalFull
          open={isAddClientModalOpen}
          onClose={() => setIsAddClientModalOpen(false)}
          onClientAdded={handleClientAdded}
          initialSearchTerm={searchTerm}
          companyId={activeCompanyId}
        />
      )}
    </>
  );
};

export default ClientSearchModal;
