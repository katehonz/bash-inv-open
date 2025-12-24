import React, { useState, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Business as BusinessIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { useCompany } from '../context/CompanyContext';
import { GET_ALL_COMPANIES_WITH_DETAILS } from '../graphql/queries';

const SelectCompany = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { activeCompanyId, setActiveCompanyId } = useCompany();
  const navigate = useNavigate();

  const { data, loading, error } = useQuery(GET_ALL_COMPANIES_WITH_DETAILS);
  const companies = data?.allCompanies || [];

  // Filter companies based on search term
  const filteredCompanies = useMemo(() => {
    if (!searchTerm.trim()) {
      return companies;
    }
    const lowerSearch = searchTerm.toLowerCase();
    return companies.filter(
      (company) =>
        company.name?.toLowerCase().includes(lowerSearch) ||
        company.eik?.toLowerCase().includes(lowerSearch) ||
        company.vatNumber?.toLowerCase().includes(lowerSearch) ||
        company.city?.toLowerCase().includes(lowerSearch)
    );
  }, [companies, searchTerm]);

  const handleSelectCompany = (companyId) => {
    setActiveCompanyId(companyId);
    navigate('/');
  };

  const activeCompany = companies.find((c) => c.id === activeCompanyId);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">Грешка при зареждане на фирмите: {error.message}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Избор на активна фирма
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Изберете фирмата, с която искате да работите. Само една фирма може да бъде активна едновременно.
        </Typography>
      </Box>

      {/* Current Active Company */}
      {activeCompany && (
        <Paper sx={{ p: 3, mb: 4, bgcolor: 'success.light', color: 'success.contrastText' }}>
          <Box display="flex" alignItems="center" gap={2}>
            <CheckCircleIcon fontSize="large" />
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Текуща активна фирма: {activeCompany.name}
              </Typography>
              <Typography variant="body2">
                ЕИК: {activeCompany.eik || '-'} | ДДС: {activeCompany.vatNumber || '-'}
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Search */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Търсене по име, ЕИК, ДДС номер или град..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          variant="outlined"
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Намерени: {filteredCompanies.length} от {companies.length} фирми
        </Typography>
      </Paper>

      {/* Companies Grid */}
      {filteredCompanies.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Няма намерени фирми
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Опитайте с друг критерий за търсене
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredCompanies.map((company) => {
            const isActive = company.id === activeCompanyId;
            return (
              <Grid item xs={12} sm={6} md={4} key={company.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    border: isActive ? 2 : 1,
                    borderColor: isActive ? 'success.main' : 'divider',
                    bgcolor: isActive ? 'success.light' : 'background.paper',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" alignItems="flex-start" gap={1} mb={2}>
                      <BusinessIcon color={isActive ? 'success' : 'primary'} />
                      <Box flex={1}>
                        <Typography variant="h6" component="div" fontWeight="bold">
                          {company.name}
                        </Typography>
                        {isActive && (
                          <Chip
                            label="Активна"
                            size="small"
                            color="success"
                            icon={<CheckCircleIcon />}
                            sx={{ mt: 0.5 }}
                          />
                        )}
                      </Box>
                    </Box>

                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>ЕИК:</strong> {company.eik || '-'}
                      </Typography>
                      {company.vatNumber && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>ДДС:</strong> {company.vatNumber}
                        </Typography>
                      )}
                      {company.city && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Град:</strong> {company.city}
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {company.isVatRegistered && (
                        <Chip label="ДДС регистрация" size="small" color="info" variant="outlined" />
                      )}
                      {company.isActive && (
                        <Chip label="Активна" size="small" color="success" variant="outlined" />
                      )}
                    </Box>
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0 }}>
                    {isActive ? (
                      <Button fullWidth variant="contained" color="success" disabled startIcon={<CheckCircleIcon />}>
                        Текуща фирма
                      </Button>
                    ) : (
                      <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        onClick={() => handleSelectCompany(company.id)}
                      >
                        Направи активна
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
};

export default SelectCompany;
