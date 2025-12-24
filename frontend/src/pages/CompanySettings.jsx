import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Payment as PaymentIcon,
  AccountBalance as BankIcon,
  Numbers as NumbersIcon,
  Euro as EuroIcon,
} from '@mui/icons-material';
import Company from './Company';
import PaymentMethodsTab from '../components/PaymentMethodsTab';
import BankAccountsTab from '../components/BankAccountsTab';
import DocumentSequencesTab from '../components/DocumentSequencesTab';
import CurrencyTab from '../components/CurrencyTab';
import { useCompany } from '../context/CompanyContext';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`company-tabpanel-${index}`}
      aria-labelledby={`company-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `company-tab-${index}`,
    'aria-controls': `company-tabpanel-${index}`,
  };
}

const CompanySettings = () => {
  const { activeCompanyId } = useCompany();
  const [value, setValue] = useState(0);
  const companyId = activeCompanyId;

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Настройки на фирмата
      </Typography>

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={value} 
            onChange={handleChange} 
            aria-label="company settings tabs"
            variant="fullWidth"
          >
            <Tab
              icon={<BusinessIcon />}
              label="Основни данни"
              {...a11yProps(0)}
              sx={{ textTransform: 'none' }}
            />
            <Tab
              icon={<PaymentIcon />}
              label="Начини на плащане"
              {...a11yProps(1)}
              sx={{ textTransform: 'none' }}
            />
            <Tab
              icon={<BankIcon />}
              label="Банкови сметки"
              {...a11yProps(2)}
              sx={{ textTransform: 'none' }}
            />
            <Tab
              icon={<NumbersIcon />}
              label="Серийни номера"
              {...a11yProps(3)}
              sx={{ textTransform: 'none' }}
            />
            <Tab
              icon={<EuroIcon />}
              label="Валути и курсове"
              {...a11yProps(4)}
              sx={{ textTransform: 'none' }}
            />
          </Tabs>
        </Box>

        <TabPanel value={value} index={0}>
          <Company />
        </TabPanel>
        
        <TabPanel value={value} index={1}>
          <PaymentMethodsTab companyId={companyId} />
        </TabPanel>
        
        <TabPanel value={value} index={2}>
          <BankAccountsTab companyId={companyId} />
        </TabPanel>
        
        <TabPanel value={value} index={3}>
          <DocumentSequencesTab companyId={companyId} />
        </TabPanel>
        
        <TabPanel value={value} index={4}>
          <CurrencyTab companyId={companyId} />
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default CompanySettings;