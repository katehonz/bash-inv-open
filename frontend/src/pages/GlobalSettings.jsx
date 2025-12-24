import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tab,
  Tabs,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Stack,
  Chip,
  Alert,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  SupervisorAccount as AdminIcon,
  Backup as BackupIcon,
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon,
  Schedule as ScheduleIcon,
  Storage as StorageIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import { GET_ACTIVE_VAT_RATES, GET_ALL_VAT_EXEMPTION_REASONS, GET_ALL_CURRENCIES, GET_CURRENCY_SYSTEM_STATUS, GET_LATEST_EXCHANGE_RATES, GET_EXCHANGE_RATES_FOR_DATE, GET_ALL_USERS, GET_ALL_COMPANIES_WITH_DETAILS, GET_SMTP_SETTINGS, GET_BACKUP_SETTINGS, GET_BACKUP_HISTORY, GET_BACKUP_STATS } from '../graphql/queries';
import { CREATE_VAT_RATE, UPDATE_VAT_RATE, DELETE_VAT_RATE, CREATE_VAT_EXEMPTION_REASON, UPDATE_VAT_EXEMPTION_REASON, DELETE_VAT_EXEMPTION_REASON, SYNC_EXCHANGE_RATES, SYNC_HISTORICAL_RATES, SET_EUROZONE_MODE, UPDATE_USER, CHANGE_USER_PASSWORD, ACTIVATE_USER, DEACTIVATE_USER, CREATE_COMPANY, UPDATE_COMPANY, CREATE_USER, CREATE_SMTP_SETTINGS, UPDATE_SMTP_SETTINGS, DELETE_SMTP_SETTINGS, ACTIVATE_SMTP_SETTINGS, TEST_SMTP_CONNECTION, SAVE_BACKUP_SETTINGS, TEST_BACKUP_CONNECTION, CREATE_MANUAL_BACKUP, DELETE_BACKUP, GET_BACKUP_DOWNLOAD_URL } from '../graphql/mutations';
import SuccessNotification from '../components/SuccessNotification';
import { useAuth } from '../context/AuthContext';



function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
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
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

const GlobalSettings = () => {
  const { user } = useAuth();
  
  // All hooks must be declared before any conditional returns
  const [tabValue, setTabValue] = useState(0);
  const [vatRateDialog, setVatRateDialog] = useState(false);
  const [exemptionDialog, setExemptionDialog] = useState(false);
  const [deleteVatRateDialog, setDeleteVatRateDialog] = useState(false);
  const [deleteExemptionDialog, setDeleteExemptionDialog] = useState(false);
  const [editingVatRate, setEditingVatRate] = useState(null);
  const [editingExemption, setEditingExemption] = useState(null);
  const [deletingVatRate, setDeletingVatRate] = useState(null);
  const [deletingExemption, setDeletingExemption] = useState(null);
  const [userDialog, setUserDialog] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [companyDialog, setCompanyDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingCompany, setEditingCompany] = useState(null);
  const [changingPasswordUser, setChangingPasswordUser] = useState(null);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [historicalSyncFromDate, setHistoricalSyncFromDate] = useState('');
  const [historicalSyncToDate, setHistoricalSyncToDate] = useState('');
  const [isHistoricalSyncLoading, setIsHistoricalSyncLoading] = useState(false);
  const [lookupDate, setLookupDate] = useState('');
  const [lookupRatesData, setLookupRatesData] = useState(null);
  const [isLookupLoading, setIsLookupLoading] = useState(false);

  // SMTP Settings state
  const [smtpDialog, setSmtpDialog] = useState(false);
  const [editingSmtp, setEditingSmtp] = useState(null);
  const [smtpTestLoading, setSmtpTestLoading] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState(null);

  // Backup Settings state
  const [backupDialog, setBackupDialog] = useState(false);
  const [backupTestLoading, setBackupTestLoading] = useState(false);
  const [backupTestResult, setBackupTestResult] = useState(null);
  const [backupInProgress, setBackupInProgress] = useState(false);

  const [vatRateForm, setVatRateForm] = useState({
    rateValue: 0,
    rateName: '',
    rateNameEn: '',
    isDefault: false,
    isActive: true,
    description: '',
    sortOrder: 0,
  });

  const [exemptionForm, setExemptionForm] = useState({
    reasonCode: '',
    reasonName: '',
    reasonNameEn: '',
    legalBasis: '',
    legalBasisEn: '',
    isActive: true,
    description: '',
    sortOrder: 0,
  });

  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'USER',
    isActive: true,
    companyId: '',
  });

  const [companyForm, setCompanyForm] = useState({
    name: '',
    nameEn: '',
    eik: '',
    vatNumber: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    userLimit: 5,
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const [smtpForm, setSmtpForm] = useState({
    host: '',
    port: 587,
    username: '',
    password: '',
    useTls: true,
    useSsl: false,
    fromEmail: '',
    fromName: '',
    provider: 'CUSTOM',
    description: '',
  });

  const [backupForm, setBackupForm] = useState({
    s3Endpoint: '',
    s3Region: 'eu-central-1',
    s3BucketName: '',
    s3AccessKey: '',
    s3SecretKey: '',
    backupPrefix: 'backup',
    autoBackupEnabled: false,
    backupCronExpression: '0 0 2 * * ?',
    retentionDays: 30,
    maxBackups: 10,
  });

  // Apollo Client
  const client = useApolloClient();

  // Queries
  const { data: vatRatesData, loading: vatRatesLoading, refetch: refetchVatRates } = useQuery(GET_ACTIVE_VAT_RATES);
  const { data: exemptionReasonsData, loading: exemptionReasonsLoading, refetch: refetchExemptionReasons } = useQuery(GET_ALL_VAT_EXEMPTION_REASONS);
  const { data: currenciesData, loading: currenciesLoading, refetch: refetchCurrencies } = useQuery(GET_ALL_CURRENCIES);
  const { data: currencyStatusData, loading: currencyStatusLoading, refetch: refetchCurrencyStatus } = useQuery(GET_CURRENCY_SYSTEM_STATUS);
  const { data: exchangeRatesData, loading: exchangeRatesLoading, refetch: refetchExchangeRates } = useQuery(GET_LATEST_EXCHANGE_RATES);
  const { data: usersData, loading: usersLoading, refetch: refetchUsers } = useQuery(GET_ALL_USERS);
  const { data: companiesData, loading: companiesLoading, refetch: refetchCompanies } = useQuery(GET_ALL_COMPANIES_WITH_DETAILS);
  const { data: smtpData, loading: smtpLoading, refetch: refetchSmtpSettings } = useQuery(GET_SMTP_SETTINGS, {
    skip: user?.role !== 'SUPER_ADMIN'
  });
  const { data: backupSettingsData, loading: backupSettingsLoading, refetch: refetchBackupSettings } = useQuery(GET_BACKUP_SETTINGS, {
    skip: user?.role !== 'SUPER_ADMIN'
  });
  const { data: backupHistoryData, loading: backupHistoryLoading, refetch: refetchBackupHistory } = useQuery(GET_BACKUP_HISTORY, {
    skip: user?.role !== 'SUPER_ADMIN'
  });
  const { data: backupStatsData, loading: backupStatsLoading, refetch: refetchBackupStats } = useQuery(GET_BACKUP_STATS, {
    skip: user?.role !== 'SUPER_ADMIN'
  });

  // Mutations
  const [createVatRate] = useMutation(CREATE_VAT_RATE);
  const [updateVatRate] = useMutation(UPDATE_VAT_RATE);
  const [deleteVatRate] = useMutation(DELETE_VAT_RATE);
  const [createVatExemptionReason] = useMutation(CREATE_VAT_EXEMPTION_REASON);
  const [updateVatExemptionReason] = useMutation(UPDATE_VAT_EXEMPTION_REASON);
  const [deleteVatExemptionReason] = useMutation(DELETE_VAT_EXEMPTION_REASON);
  const [syncExchangeRates] = useMutation(SYNC_EXCHANGE_RATES);
  const [syncHistoricalRates] = useMutation(SYNC_HISTORICAL_RATES);
  const [setEurozoneMode] = useMutation(SET_EUROZONE_MODE);
  const [updateUser] = useMutation(UPDATE_USER);
  const [changeUserPassword] = useMutation(CHANGE_USER_PASSWORD);
  const [activateUser] = useMutation(ACTIVATE_USER);
  const [deactivateUser] = useMutation(DEACTIVATE_USER);
  const [createCompany] = useMutation(CREATE_COMPANY);
  const [updateCompany] = useMutation(UPDATE_COMPANY);
  const [createUser] = useMutation(CREATE_USER);
  const [createSmtpSettings] = useMutation(CREATE_SMTP_SETTINGS);
  const [updateSmtpSettings] = useMutation(UPDATE_SMTP_SETTINGS);
  const [deleteSmtpSettings] = useMutation(DELETE_SMTP_SETTINGS);
  const [activateSmtpSettings] = useMutation(ACTIVATE_SMTP_SETTINGS);
  const [testSmtpConnection] = useMutation(TEST_SMTP_CONNECTION);
  const [saveBackupSettings] = useMutation(SAVE_BACKUP_SETTINGS);
  const [testBackupConnection] = useMutation(TEST_BACKUP_CONNECTION);
  const [createManualBackup] = useMutation(CREATE_MANUAL_BACKUP);
  const [deleteBackup] = useMutation(DELETE_BACKUP);
  const [getBackupDownloadUrl] = useMutation(GET_BACKUP_DOWNLOAD_URL);

  // Set default dates (30 days back to today)
  React.useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    if (!historicalSyncFromDate) {
      setHistoricalSyncFromDate(thirtyDaysAgo.toISOString().split('T')[0]);
    }
    if (!historicalSyncToDate) {
      setHistoricalSyncToDate(today.toISOString().split('T')[0]);
    }
  }, [historicalSyncFromDate, historicalSyncToDate]);

  // Load backup settings into form when data is available
  React.useEffect(() => {
    if (backupSettingsData?.backupSettings) {
      const settings = backupSettingsData.backupSettings;
      setBackupForm({
        s3Endpoint: settings.s3Endpoint || '',
        s3Region: settings.s3Region || 'eu-central-1',
        s3BucketName: settings.s3BucketName || '',
        s3AccessKey: settings.s3AccessKey || '',
        s3SecretKey: '', // Never populate from server
        backupPrefix: settings.backupPrefix || 'backup',
        autoBackupEnabled: settings.autoBackupEnabled || false,
        backupCronExpression: settings.backupCronExpression || '0 2 * * *',
        retentionDays: settings.retentionDays || 30,
        maxBackups: settings.maxBackups || 10,
      });
    }
  }, [backupSettingsData]);

  // Ограничаване на достъпа само за SUPER_ADMIN потребители
  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 4 }}>
              <SettingsIcon color="disabled" sx={{ fontSize: 64 }} />
              <Typography variant="h5" color="text.secondary">
                Отказан достъп
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Глобалните настройки са достъпни само за супер администратори.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Моля, свържете се с администратора на системата за достъп.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleVatRateFormChange = (field, value) => {
    setVatRateForm(prev => ({ ...prev, [field]: value }));
  };

  const handleExemptionFormChange = (field, value) => {
    setExemptionForm(prev => ({ ...prev, [field]: value }));
  };

  const handleUserFormChange = (field, value) => {
    setUserForm(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordFormChange = (field, value) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCompanyFormChange = (field, value) => {
    setCompanyForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSmtpFormChange = (field, value) => {
    setSmtpForm(prev => ({ ...prev, [field]: value }));
  };

  const handleBackupFormChange = (field, value) => {
    setBackupForm(prev => ({ ...prev, [field]: value }));
  };

  const openVatRateDialog = (vatRate) => {
    if (vatRate) {
      setEditingVatRate(vatRate);
      setVatRateForm({
        id: vatRate.id,
        rateValue: vatRate.rateValue,
        rateName: vatRate.rateName,
        rateNameEn: vatRate.rateNameEn || '',
        isDefault: vatRate.isDefault,
        isActive: vatRate.isActive,
        description: vatRate.description || '',
        sortOrder: vatRate.sortOrder || 0,
      });
    } else {
      setEditingVatRate(null);
      setVatRateForm({
        rateValue: 0,
        rateName: '',
        rateNameEn: '',
        isDefault: false,
        isActive: true,
        description: '',
        sortOrder: 0,
      });
    }
    setVatRateDialog(true);
  };

  const openExemptionDialog = (exemption) => {
    if (exemption) {
      setEditingExemption(exemption);
      setExemptionForm({
        id: exemption.id,
        reasonCode: exemption.reasonCode,
        reasonName: exemption.reasonName,
        reasonNameEn: exemption.reasonNameEn || '',
        legalBasis: exemption.legalBasis,
        legalBasisEn: exemption.legalBasisEn || '',
        isActive: exemption.isActive,
        description: exemption.description || '',
        sortOrder: exemption.sortOrder || 0,
      });
    } else {
      setEditingExemption(null);
      setExemptionForm({
        reasonCode: '',
        reasonName: '',
        reasonNameEn: '',
        legalBasis: '',
        legalBasisEn: '',
        isActive: true,
        description: '',
        sortOrder: 0,
      });
    }
    setExemptionDialog(true);
  };

  const openUserDialog = (user) => {
    if (user) {
      setEditingUser(user);
      setUserForm({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        companyId: user.company?.id || '',
      });
    } else {
      setEditingUser(null);
      setUserForm({
        username: '',
        email: '',
        password: '',
        role: 'USER',
        isActive: true,
        companyId: '',
      });
    }
    setUserDialog(true);
  };

  const openCompanyDialog = (company) => {
    if (company) {
      setEditingCompany(company);
      setCompanyForm({
        id: company.id,
        name: company.name,
        nameEn: company.nameEn || '',
        eik: company.eik || '',
        vatNumber: company.vatNumber || '',
        address: company.address || '',
        phone: company.phone || '',
        email: company.email || '',
        website: company.website || '',
        userLimit: company.userLimit || 5,
      });
    } else {
      setEditingCompany(null);
      setCompanyForm({
        name: '',
        nameEn: '',
        eik: '',
        vatNumber: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        userLimit: 5,
      });
    }
    setCompanyDialog(true);
  };

  const openPasswordDialog = (user) => {
    setChangingPasswordUser(user);
    setPasswordForm({
      newPassword: '',
      confirmPassword: '',
    });
    setPasswordDialog(true);
  };

  const openSmtpDialog = (smtp) => {
    console.log('SMTP Dialog Opening:', smtp ? 'Edit Mode' : 'Create Mode');
    if (smtp) {
      setEditingSmtp(smtp);
      // Map backend fields to frontend form fields
      setSmtpForm({
        id: smtp.id,
        host: smtp.smtpHost,                    // smtpHost → host
        port: smtp.smtpPort,                    // smtpPort → port
        username: smtp.smtpUsername,            // smtpUsername → username
        password: '', // Don't populate password for security
        useTls: smtp.useTls,
        useSsl: smtp.useSsl,
        fromEmail: smtp.fromEmail,
        fromName: smtp.fromName || '',
        provider: smtp.providerName || 'CUSTOM', // providerName → provider
        description: '',  // Backend doesn't have description field anymore
      });
      console.log('SMTP Edit Form Data:', smtp);
    } else {
      setEditingSmtp(null);
      setSmtpForm({
        host: '',
        port: 587,
        username: '',
        password: '',
        useTls: true,
        useSsl: false,
        fromEmail: '',
        fromName: '',
        provider: 'CUSTOM',
        description: '',
      });
      console.log('SMTP Create Form Initialized');
    }
    setSmtpDialog(true);
  };

  const handleTestSmtpConnection = async (smtp) => {
    console.log('Testing SMTP Connection for:', smtp.host);
    setSmtpTestLoading(true);
    setSmtpTestResult(null);
    
    try {
      const { data } = await testSmtpConnection({
        variables: { id: smtp.id }
      });
      
      const result = data.testSmtpSettings;
      console.log('SMTP Test Result:', result);
      
      setSmtpTestResult({
        success: result.success,
        message: result.message,
        details: result.details
      });
      
      // Refresh SMTP settings to update connection status
      refetchSmtpSettings();
      
    } catch (error) {
      console.error('SMTP Test Error:', error);
      setSmtpTestResult({
        success: false,
        message: 'Грешка при тестване на SMTP връзката',
        details: error.message
      });
    } finally {
      setSmtpTestLoading(false);
    }
  };

  const handleActivateSmtp = async (smtp) => {
    console.log('Activating SMTP Configuration:', smtp.id);
    
    try {
      await activateSmtpSettings({
        variables: { id: smtp.id }
      });
      
      console.log('SMTP Configuration Activated Successfully');
      refetchSmtpSettings();
      setShowSuccessNotification(true);
      
    } catch (error) {
      console.error('SMTP Activation Error:', error);
      alert('Грешка при активиране на SMTP конфигурацията');
    }
  };

  const handleDeleteSmtp = async (smtp) => {
    console.log('Deleting SMTP Configuration:', smtp.id);
    
    if (!window.confirm(`Сигурни ли сте, че искате да изтриете SMTP конфигурацията за ${smtp.smtpHost || smtp.host}?`)) {
      return;
    }
    
    try {
      await deleteSmtpSettings({
        variables: { id: smtp.id }
      });
      
      console.log('SMTP Configuration Deleted Successfully');
      refetchSmtpSettings();
      setShowSuccessNotification(true);
      
    } catch (error) {
      console.error('SMTP Deletion Error:', error);
      alert('Грешка при изтриване на SMTP конфигурацията');
    }
  };

  const handleSaveVatRate = async () => {
    try {
      if (editingVatRate) {
        // Update existing VAT rate
        await updateVatRate({
          variables: {
            input: {
              id: editingVatRate.id,
              rateValue: vatRateForm.rateValue,
              rateName: vatRateForm.rateName,
              rateNameEn: vatRateForm.rateNameEn,
              description: vatRateForm.description,
              isDefault: vatRateForm.isDefault,
              sortOrder: vatRateForm.sortOrder,
              isActive: vatRateForm.isActive,
            }
          }
        });
      } else {
        // Create new VAT rate
        await createVatRate({
          variables: {
            input: {
              rateValue: vatRateForm.rateValue,
              rateName: vatRateForm.rateName,
              rateNameEn: vatRateForm.rateNameEn,
              description: vatRateForm.description,
              isDefault: vatRateForm.isDefault,
              sortOrder: vatRateForm.sortOrder,
            }
          }
        });
      }
      setVatRateDialog(false);
      refetchVatRates();
      setShowSuccessNotification(true);
    } catch (error) {
      console.error('Error saving VAT rate:', error);
    }
  };

  const handleSaveExemption = async () => {
    try {
      if (editingExemption) {
        // Update existing exemption reason
        await updateVatExemptionReason({
          variables: {
            input: {
              id: editingExemption.id,
              reasonCode: exemptionForm.reasonCode,
              reasonName: exemptionForm.reasonName,
              reasonNameEn: exemptionForm.reasonNameEn,
              legalBasis: exemptionForm.legalBasis,
              legalBasisEn: exemptionForm.legalBasisEn,
              description: exemptionForm.description,
              sortOrder: exemptionForm.sortOrder,
              isActive: exemptionForm.isActive,
            }
          }
        });
      } else {
        // Create new exemption reason
        await createVatExemptionReason({
          variables: {
            input: {
              reasonCode: exemptionForm.reasonCode,
              reasonName: exemptionForm.reasonName,
              reasonNameEn: exemptionForm.reasonNameEn,
              legalBasis: exemptionForm.legalBasis,
              legalBasisEn: exemptionForm.legalBasisEn,
              description: exemptionForm.description,
              sortOrder: exemptionForm.sortOrder,
            }
          }
        });
      }
      setExemptionDialog(false);
      refetchExemptionReasons();
      setShowSuccessNotification(true);
    } catch (error) {
      console.error('Error saving exemption reason:', error);
    }
  };

  const handleSaveUser = async () => {
    try {
      if (editingUser) {
        // Update existing user
        await updateUser({
          variables: { input: userForm }
        });
      } else {
        // Create new user
        if (!userForm.password || userForm.password.length < 6) {
          alert('Паролата трябва да е поне 6 символа');
          return;
        }
        await createUser({
          variables: {
            input: {
              username: userForm.username,
              email: userForm.email,
              password: userForm.password,
              role: userForm.role,
              companyId: userForm.companyId && userForm.companyId !== '' ? parseInt(userForm.companyId) : null,
              isActive: userForm.isActive
            }
          }
        });
      }
      setUserDialog(false);
      refetchUsers();
      refetchCompanies();
      setShowSuccessNotification(true);
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Грешка при запазване на потребителя');
    }
  };

  const handleSaveCompany = async () => {
    try {
      if (editingCompany) {
        // Update existing company
        await updateCompany({
          variables: {
            id: editingCompany.id,
            input: {
              name: companyForm.name,
              nameEn: companyForm.nameEn || null,
              eik: companyForm.eik || null,
              vatNumber: companyForm.vatNumber || null,
              address: companyForm.address || null,
              phone: companyForm.phone || null,
              email: companyForm.email || null,
              website: companyForm.website || null,
              // Note: userLimit не се обновява за съществуващи фирми за да се избегнат проблеми с квотите
            }
          }
        });
      } else {
        // Create new company
        await createCompany({
          variables: {
            input: {
              name: companyForm.name,
              eik: companyForm.eik,
              vatNumber: companyForm.vatNumber,
              address: companyForm.address,
              phone: companyForm.phone,
              email: companyForm.email,
              website: companyForm.website,
              userLimit: companyForm.userLimit
            }
          }
        });
      }
      setCompanyDialog(false);
      refetchCompanies();
      setShowSuccessNotification(true);
    } catch (error) {
      console.error('Error saving company:', error);
      alert('Грешка при запазване на фирмата');
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Паролите не съвпадат');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      alert('Паролата трябва да е поне 6 символа');
      return;
    }

    try {
      await changeUserPassword({
        variables: {
          input: {
            userId: changingPasswordUser.id,
            newPassword: passwordForm.newPassword
          }
        }
      });
      setPasswordDialog(false);
      alert('Паролата е променена успешно');
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Грешка при промяна на паролата');
    }
  };

  const handleActivateUser = async (user) => {
    try {
      await activateUser({
        variables: { userId: user.id }
      });
      refetchUsers();
    } catch (error) {
      console.error('Error activating user:', error);
    }
  };

  const handleDeactivateUser = async (user) => {
    try {
      await deactivateUser({
        variables: { userId: user.id }
      });
      refetchUsers();
    } catch (error) {
      console.error('Error deactivating user:', error);
    }
  };

  const handleSaveSmtp = async () => {
    console.log('Saving SMTP Configuration:', smtpForm);
    
    // Validation
    if (!smtpForm.host || !smtpForm.username || !smtpForm.fromEmail || !smtpForm.port) {
      alert('Моля попълнете всички задължителни полета');
      return;
    }
    
    if (!editingSmtp && !smtpForm.password) {
      alert('Паролата е задължителна за нови SMTP конфигурации');
      return;
    }
    
    try {
      // Map frontend form fields to backend schema fields
      const backendInput = {
        smtpHost: smtpForm.host,                    // host → smtpHost
        smtpPort: smtpForm.port,                    // port → smtpPort
        smtpUsername: smtpForm.username,            // username → smtpUsername
        smtpPassword: smtpForm.password,            // password → smtpPassword
        fromEmail: smtpForm.fromEmail,              // matches
        fromName: smtpForm.fromName,                // matches
        useTls: smtpForm.useTls,                    // matches
        useSsl: smtpForm.useSsl,                    // matches
        smtpAuth: true,                             // always enable SMTP auth
        providerName: smtpForm.provider             // provider → providerName
      };

      if (editingSmtp) {
        console.log('Updating existing SMTP configuration');
        // For updates, remove password if empty
        if (!backendInput.smtpPassword) {
          delete backendInput.smtpPassword;
        }
        
        await updateSmtpSettings({
          variables: {
            id: editingSmtp.id,
            input: backendInput
          }
        });
        console.log('SMTP Configuration Updated Successfully');
      } else {
        console.log('Creating new SMTP configuration');
        await createSmtpSettings({
          variables: { input: backendInput }
        });
        console.log('SMTP Configuration Created Successfully');
      }
      
      setSmtpDialog(false);
      refetchSmtpSettings();
      setShowSuccessNotification(true);
      
    } catch (error) {
      console.error('SMTP Save Error:', error);
      console.error('GraphQL errors:', error.graphQLErrors);
      console.error('Network error:', error.networkError);
      alert(`Грешка при запазване на SMTP конфигурацията: ${error.message}`);
    }
  };

  const openDeleteVatRateDialog = (vatRate) => {
    setDeletingVatRate(vatRate);
    setDeleteVatRateDialog(true);
  };

  const openDeleteExemptionDialog = (exemption) => {
    setDeletingExemption(exemption);
    setDeleteExemptionDialog(true);
  };

  const handleDeleteVatRate = async () => {
    try {
      await deleteVatRate({
        variables: {
          id: deletingVatRate.id
        }
      });
      setDeleteVatRateDialog(false);
      setDeletingVatRate(null);
      refetchVatRates();
      setShowSuccessNotification(true);
    } catch (error) {
      console.error('Error deleting VAT rate:', error);
      alert('Грешка при изтриване на ДДС ставката');
    }
  };

  const handleDeleteExemption = async () => {
    try {
      await deleteVatExemptionReason({
        variables: {
          id: deletingExemption.id
        }
      });
      setDeleteExemptionDialog(false);
      setDeletingExemption(null);
      refetchExemptionReasons();
      setShowSuccessNotification(true);
    } catch (error) {
      console.error('Error deleting exemption reason:', error);
      alert('Грешка при изтриване на основанието за неначисляване на ДДС');
    }
  };

  const handleHistoricalSync = async () => {
    if (!historicalSyncFromDate || !historicalSyncToDate) {
      alert('Моля въведете от и до дата');
      return;
    }

    if (new Date(historicalSyncFromDate) > new Date(historicalSyncToDate)) {
      alert('Началната дата трябва да е преди крайната дата');
      return;
    }

    setIsHistoricalSyncLoading(true);
    try {
      await syncHistoricalRates({
        variables: {
          fromDate: historicalSyncFromDate,
          toDate: historicalSyncToDate,
        },
      });
      refetchCurrencyStatus();
      refetchExchangeRates();
      refetchCurrencies();
      setShowSuccessNotification(true);
    } catch (error) {
      console.error('Error syncing historical rates:', error);
      alert('Грешка при синхронизация на историческите курсове');
    } finally {
      setIsHistoricalSyncLoading(false);
    }
  };


  const vatRates = vatRatesData?.activeVatRates || [];
  const exemptionReasons = exemptionReasonsData?.allVatExemptionReasons || [];

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

  // Backup handlers
  const handleSaveBackupSettings = async () => {
    try {
      await saveBackupSettings({
        variables: {
          input: {
            s3Endpoint: backupForm.s3Endpoint,
            s3Region: backupForm.s3Region,
            s3BucketName: backupForm.s3BucketName,
            s3AccessKey: backupForm.s3AccessKey,
            s3SecretKey: backupForm.s3SecretKey || undefined,
            backupPrefix: backupForm.backupPrefix,
            autoBackupEnabled: backupForm.autoBackupEnabled,
            backupCronExpression: backupForm.backupCronExpression,
            retentionDays: backupForm.retentionDays,
            maxBackups: backupForm.maxBackups,
          }
        }
      });
      refetchBackupSettings();
      refetchBackupStats();
      setShowSuccessNotification(true);
      setBackupDialog(false);
    } catch (error) {
      console.error('Error saving backup settings:', error);
      alert('Грешка при запазване на настройките за архивиране');
    }
  };

  const handleTestBackupConnection = async () => {
    setBackupTestLoading(true);
    setBackupTestResult(null);
    try {
      const { data } = await testBackupConnection();
      const result = data.testBackupConnection;
      setBackupTestResult({
        success: result.startsWith('SUCCESS'),
        message: result
      });
    } catch (error) {
      console.error('Error testing backup connection:', error);
      setBackupTestResult({
        success: false,
        message: 'Грешка при тестване на връзката: ' + error.message
      });
    } finally {
      setBackupTestLoading(false);
    }
  };

  const handleCreateManualBackup = async () => {
    setBackupInProgress(true);
    try {
      await createManualBackup();
      refetchBackupHistory();
      refetchBackupStats();
      refetchBackupSettings();
      setShowSuccessNotification(true);
    } catch (error) {
      console.error('Error creating manual backup:', error);
      alert('Грешка при създаване на архив: ' + error.message);
    } finally {
      setBackupInProgress(false);
    }
  };

  const handleDeleteBackup = async (backupId) => {
    if (!window.confirm('Сигурни ли сте, че искате да изтриете този архив?')) {
      return;
    }
    try {
      await deleteBackup({ variables: { id: backupId } });
      refetchBackupHistory();
      refetchBackupStats();
      setShowSuccessNotification(true);
    } catch (error) {
      console.error('Error deleting backup:', error);
      alert('Грешка при изтриване на архива');
    }
  };

  const handleDownloadBackup = async (backupId) => {
    try {
      const { data } = await getBackupDownloadUrl({ variables: { id: backupId } });
      if (data.getBackupDownloadUrl) {
        window.open(data.getBackupDownloadUrl, '_blank');
      } else {
        alert('Не може да се генерира линк за изтегляне');
      }
    } catch (error) {
      console.error('Error getting download URL:', error);
      alert('Грешка при генериране на линк за изтегляне');
    }
  };

  const openBackupDialog = () => {
    setBackupDialog(true);
    setBackupTestResult(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon color="primary" />
          Глобални настройки
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => {
            refetchVatRates();
            refetchExemptionReasons();
            refetchCurrencies();
            refetchCurrencyStatus();
            refetchExchangeRates();
            refetchUsers();
            refetchCompanies();
            if (user?.role === 'SUPER_ADMIN') {
              refetchSmtpSettings();
              refetchBackupSettings();
              refetchBackupHistory();
              refetchBackupStats();
            }
          }}
        >
          Обнови
        </Button>
      </Box>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="settings tabs">
            <Tab label="ДДС ставки" {...a11yProps(0)} />
            <Tab label="Основания за неначисляване на ДДС" {...a11yProps(1)} />
            <Tab label="Фирми и потребители" {...a11yProps(2)} />
            {user?.role === 'SUPER_ADMIN' && (
              <Tab label="SMTP настройки" {...a11yProps(3)} />
            )}
            {user?.role === 'SUPER_ADMIN' && (
              <Tab label="Архивиране" {...a11yProps(4)} />
            )}
          </Tabs>
        </Box>

        {/* VAT Rates Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Управление на ДДС ставки
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => openVatRateDialog()}
            >
              Добави ДДС ставка
            </Button>
          </Box>

          {vatRatesLoading ? (
            <LinearProgress />
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Ставка</TableCell>
                    <TableCell>Наименование</TableCell>
                    <TableCell>Английско наименование</TableCell>
                    <TableCell>Статус</TableCell>
                    <TableCell>Подразбиране</TableCell>
                    <TableCell>Описание</TableCell>
                    <TableCell align="right">Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vatRates.map((rate) => (
                    <TableRow key={rate.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {rate.formattedRate}
                        </Typography>
                      </TableCell>
                      <TableCell>{rate.rateName}</TableCell>
                      <TableCell>{rate.rateNameEn || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={rate.isActive ? 'Активна' : 'Неактивна'}
                          color={rate.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {rate.isDefault && (
                          <Chip label="По подразбиране" color="primary" size="small" />
                        )}
                      </TableCell>
                      <TableCell>{rate.description || '-'}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Редактиране">
                            <IconButton
                              size="small"
                              onClick={() => openVatRateDialog(rate)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Изтриване">
                            <IconButton
                              size="small"
                              onClick={() => openDeleteVatRateDialog(rate)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        {/* VAT Exemption Reasons Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Управление на основания за неначисляване на ДДС
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => openExemptionDialog()}
            >
              Добави основание
            </Button>
          </Box>

          {exemptionReasonsLoading ? (
            <LinearProgress />
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Код</TableCell>
                    <TableCell>Наименование</TableCell>
                    <TableCell>Английско наименование</TableCell>
                    <TableCell>Правно основание</TableCell>
                    <TableCell>Статус</TableCell>
                    <TableCell align="right">Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {exemptionReasons.map((reason) => (
                    <TableRow key={reason.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {reason.reasonCode}
                        </Typography>
                      </TableCell>
                      <TableCell>{reason.reasonName}</TableCell>
                      <TableCell>{reason.reasonNameEn || '-'}</TableCell>
                      <TableCell>{reason.legalBasis}</TableCell>
                      <TableCell>
                        <Chip
                          label={reason.isActive ? 'Активно' : 'Неактивно'}
                          color={reason.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Редактиране">
                            <IconButton
                              size="small"
                              onClick={() => openExemptionDialog(reason)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Изтриване">
                            <IconButton
                              size="small"
                              onClick={() => openDeleteExemptionDialog(reason)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        {/* Companies and Users Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessIcon />
                Управление на фирми и потребители
              </Typography>
            </Box>

            {/* Companies Table */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BusinessIcon />
                    Фирми
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => openCompanyDialog()}
                  >
                    Добави фирма
                  </Button>
                </Box>
                {companiesLoading ? (
                  <LinearProgress />
                ) : (
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Име на фирмата</TableCell>
                          <TableCell>ЕИК</TableCell>
                          <TableCell>ДДС номер</TableCell>
                          <TableCell>Лимит потребители</TableCell>
                          <TableCell>Активни потребители</TableCell>
                          <TableCell>Администратор</TableCell>
                          <TableCell>Статус квота</TableCell>
                          <TableCell align="right">Действия</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(companiesData?.allCompanies || []).map((company) => {
                          const isQuotaExceeded = company.userLimit && (company.activeUserCount >= company.userLimit);

                          return (
                            <TableRow key={company.id} hover>
                              <TableCell>
                                <Typography variant="body2" fontWeight="bold">
                                  {company.name}
                                </Typography>
                              </TableCell>
                              <TableCell>{company.eik || '-'}</TableCell>
                              <TableCell>{company.vatNumber || '-'}</TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight="bold">
                                  {company.userLimit || 'Неограничено'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight="bold" color={isQuotaExceeded ? 'error' : 'success'}>
                                  {company.activeUserCount}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                {company.adminUsername ? (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <AdminIcon color="primary" fontSize="small" />
                                    <Typography variant="body2">
                                      {company.adminUsername}
                                    </Typography>
                                  </Box>
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    Няма администратор
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={isQuotaExceeded ? 'Квотата изчерпана' : 'В норма'}
                                  color={isQuotaExceeded ? 'error' : 'success'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Stack direction="row" spacing={1}>
                                  <Tooltip title="Редактиране на фирма">
                                    <IconButton
                                      size="small"
                                      onClick={() => openCompanyDialog(company)}
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
                {!companiesLoading && (!companiesData?.allCompanies || companiesData.allCompanies.length === 0) && (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      Няма налични фирми в системата.
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon />
                    Потребители
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => openUserDialog()}
                  >
                    Добави потребител
                  </Button>
                </Box>
                {usersLoading ? (
                  <LinearProgress />
                ) : (
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Потребителско име</TableCell>
                          <TableCell>Имейл</TableCell>
                          <TableCell>Фирма</TableCell>
                          <TableCell>Роля</TableCell>
                          <TableCell>Статус</TableCell>
                          <TableCell align="right">Действия</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(usersData?.allUsers || []).map((user) => (
                          <TableRow key={user.id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {user.role === 'ADMIN' && <AdminIcon color="primary" fontSize="small" />}
                                {user.role === 'SUPER_ADMIN' && <AdminIcon color="error" fontSize="small" />}
                                <Typography variant="body2" fontWeight={user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? 'bold' : 'normal'}>
                                  {user.username}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {user.company?.name || 'Няма фирма'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={
                                  user.role === 'SUPER_ADMIN' ? 'Супер Администратор' :
                                  user.role === 'ADMIN' ? 'Администратор' :
                                  user.role === 'USER' ? 'Потребител' : user.role
                                }
                                color={
                                  user.role === 'SUPER_ADMIN' ? 'error' :
                                  user.role === 'ADMIN' ? 'primary' : 'default'
                                }
                                size="small"
                                icon={
                                  (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') ? <AdminIcon /> : <PersonIcon />
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={user.isActive ? "Активен" : "Неактивен"}
                                color={user.isActive ? "success" : "default"}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Stack direction="row" spacing={1}>
                                <Tooltip title="Редактиране">
                                  <IconButton
                                    size="small"
                                    onClick={() => openUserDialog(user)}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Промяна на парола">
                                  <IconButton
                                    size="small"
                                    onClick={() => openPasswordDialog(user)}
                                    color="primary"
                                  >
                                    <PersonIcon />
                                  </IconButton>
                                </Tooltip>
                                {user.isActive ? (
                                  <Tooltip title="Деактивиране">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleDeactivateUser(user)}
                                      color="warning"
                                    >
                                      <CancelIcon />
                                    </IconButton>
                                  </Tooltip>
                                ) : (
                                  <Tooltip title="Активиране">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleActivateUser(user)}
                                      color="success"
                                    >
                                      <AddIcon />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
                {!usersLoading && (!usersData?.allUsers || usersData.allUsers.length === 0) && (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      Няма налични потребители в системата.
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Detailed Company-User Relations Table */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BusinessIcon />
                  Връзки фирми - потребители
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Детайлно разпределение на потребителите по фирми
                </Typography>
                
                {companiesLoading || usersLoading ? (
                  <LinearProgress />
                ) : (
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Фирма</TableCell>
                          <TableCell>ЕИК</TableCell>
                          <TableCell>Лимит потребители</TableCell>
                          <TableCell>Потребители</TableCell>
                          <TableCell>Роли</TableCell>
                          <TableCell>Статус квота</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {/* Фирми с потребители */}
                        {(companiesData?.allCompanies || []).map((company) => {
                          const companyUsers = (usersData?.allUsers || []).filter(user => user.company?.id === company.id);
                          const activeUsers = companyUsers.filter(user => user.isActive);
                          const isQuotaExceeded = company.userLimit && activeUsers.length >= company.userLimit;

                          return (
                            <TableRow key={company.id} hover>
                              <TableCell>
                                <Typography variant="body2" fontWeight="bold">
                                  {company.name}
                                </Typography>
                              </TableCell>
                              <TableCell>{company.eik || '-'}</TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight="bold">
                                  {company.userLimit || 'Неограничено'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                {companyUsers.length === 0 ? (
                                  <Typography variant="body2" color="text.secondary" style={{ fontStyle: 'italic' }}>
                                    Няма потребители
                                  </Typography>
                                ) : (
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                    {companyUsers.map((user) => (
                                      <Box key={user.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {user.role === 'ADMIN' && <AdminIcon color="primary" fontSize="small" />}
                                        {user.role === 'SUPER_ADMIN' && <AdminIcon color="error" fontSize="small" />}
                                        <Typography
                                          variant="body2"
                                          sx={{
                                            color: user.isActive ? 'text.primary' : 'text.disabled',
                                            textDecoration: user.isActive ? 'none' : 'line-through'
                                          }}
                                        >
                                          {user.username}
                                        </Typography>
                                        {!user.isActive && (
                                          <Chip label="Неактивен" size="small" color="default" />
                                        )}
                                      </Box>
                                    ))}
                                  </Box>
                                )}
                              </TableCell>
                              <TableCell>
                                {companyUsers.length === 0 ? (
                                  '-'
                                ) : (
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {Array.from(new Set(companyUsers.map(user => user.role))).map((role) => (
                                      <Chip
                                        key={role}
                                        label={
                                          role === 'SUPER_ADMIN' ? 'Супер Админ' :
                                          role === 'ADMIN' ? 'Админ' :
                                          role === 'USER' ? 'Потребител' :
                                          role === 'ACCOUNTANT' ? 'Счетоводител' : role
                                        }
                                        size="small"
                                        color={
                                          role === 'SUPER_ADMIN' ? 'error' :
                                          role === 'ADMIN' ? 'primary' : 'default'
                                        }
                                      />
                                    ))}
                                  </Box>
                                )}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={
                                    companyUsers.length === 0 ? 'Няма потребители' :
                                    isQuotaExceeded ? `Квота изчерпана (${activeUsers.length}/${company.userLimit})` :
                                    `В норма (${activeUsers.length}/${company.userLimit || '∞'})`
                                  }
                                  color={
                                    companyUsers.length === 0 ? 'warning' :
                                    isQuotaExceeded ? 'error' : 'success'
                                  }
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        
                        {/* Потребители без фирма */}
                        {(() => {
                          const usersWithoutCompany = (usersData?.allUsers || []).filter(user => !user.company?.id);
                          if (usersWithoutCompany.length === 0) return null;
                          
                          return (
                            <TableRow hover sx={{ backgroundColor: 'action.hover' }}>
                              <TableCell>
                                <Typography variant="body2" fontWeight="bold" color="text.secondary">
                                  Без фирма
                                </Typography>
                              </TableCell>
                              <TableCell>-</TableCell>
                              <TableCell>-</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                  {usersWithoutCompany.map((user) => (
                                    <Box key={user.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      {user.role === 'ADMIN' && <AdminIcon color="primary" fontSize="small" />}
                                      {user.role === 'SUPER_ADMIN' && <AdminIcon color="error" fontSize="small" />}
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          color: user.isActive ? 'text.primary' : 'text.disabled',
                                          textDecoration: user.isActive ? 'none' : 'line-through'
                                        }}
                                      >
                                        {user.username}
                                      </Typography>
                                      {!user.isActive && (
                                        <Chip label="Неактивен" size="small" color="default" />
                                      )}
                                    </Box>
                                  ))}
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {Array.from(new Set(usersWithoutCompany.map(user => user.role))).map((role) => (
                                    <Chip
                                      key={role}
                                      label={
                                        role === 'SUPER_ADMIN' ? 'Супер Админ' :
                                        role === 'ADMIN' ? 'Админ' :
                                        role === 'USER' ? 'Потребител' :
                                        role === 'ACCOUNTANT' ? 'Счетоводител' : role
                                      }
                                      size="small"
                                      color={
                                        role === 'SUPER_ADMIN' ? 'error' :
                                        role === 'ADMIN' ? 'primary' : 'default'
                                      }
                                    />
                                  ))}
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Chip label="Няма лимит" color="info" size="small" />
                              </TableCell>
                            </TableRow>
                          );
                        })()}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>

            {/* Summary Information */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Обобщена информация
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Общ брой фирми
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {companiesData?.allCompanies?.length || 0}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Общ брой потребители
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {usersData?.allUsers?.length || 0}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Администратори
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {usersData?.allUsers?.filter(user => user.role === 'ADMIN' || user.role === 'SUPER_ADMIN').length || 0}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Фирми с изчерпана квота
                    </Typography>
                    <Typography variant="h6" color="error">
                      {companiesData?.allCompanies?.filter(company => {
                        const companyUsers = usersData?.allUsers?.filter(user => user.company?.id === company.id) || [];
                        const activeUsers = companyUsers.filter(user => user.isActive && (user.role === 'USER' || user.role === 'ADMIN'));
                        return company.userLimit && activeUsers.length >= company.userLimit;
                      }).length || 0}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Потребители без фирма
                    </Typography>
                    <Typography variant="h6" color="warning">
                      {usersData?.allUsers?.filter(user => !user.company?.id).length || 0}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>

        {/* SMTP Settings Tab - Only for SUPER_ADMIN */}
        {user?.role === 'SUPER_ADMIN' && (
          <TabPanel value={tabValue} index={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SettingsIcon />
                  Управление на SMTP настройки
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => openSmtpDialog()}
                >
                  Добави SMTP конфигурация
                </Button>
              </Box>

              {/* SMTP Settings Table */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    SMTP Конфигурации
                  </Typography>
                  {smtpLoading ? (
                    <LinearProgress />
                  ) : (
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Провайдър</TableCell>
                            <TableCell>Host</TableCell>
                            <TableCell>Порт</TableCell>
                            <TableCell>Потребител</TableCell>
                            <TableCell>От имейл</TableCell>
                            <TableCell>Статус</TableCell>
                            <TableCell>Активен</TableCell>
                            <TableCell align="right">Действия</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(smtpData?.allSmtpSettings || []).map((smtp) => (
                            <TableRow key={smtp.id} hover>
                              <TableCell>
                                <Chip
                                  label={smtp.providerName || 'CUSTOM'}
                                  color={smtp.providerName === 'GMAIL' ? 'success' :
                                         smtp.providerName === 'OUTLOOK' ? 'info' :
                                         smtp.providerName === 'ALICLOUD' ? 'warning' : 'default'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight="bold">
                                  {smtp.smtpHost}
                                </Typography>
                              </TableCell>
                              <TableCell>{smtp.smtpPort}</TableCell>
                              <TableCell>{smtp.smtpUsername}</TableCell>
                              <TableCell>{smtp.fromEmail}</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Chip
                                    label={smtp.connectionStatus || 'Неизвестен'}
                                    color={smtp.connectionStatus === 'CONNECTED' ? 'success' :
                                           smtp.connectionStatus === 'FAILED' ? 'error' : 'default'}
                                    size="small"
                                  />
                                  {smtp.lastTestDate && (
                                    <Typography variant="caption" color="text.secondary">
                                      {new Date(smtp.lastTestDate).toLocaleDateString()}
                                    </Typography>
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={smtp.isActive ? 'Активен' : 'Неактивен'}
                                  color={smtp.isActive ? 'success' : 'default'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Stack direction="row" spacing={1}>
                                  <Tooltip title="Тестване на връзката">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleTestSmtpConnection(smtp)}
                                      disabled={smtpTestLoading}
                                      color="info"
                                    >
                                      <RefreshIcon />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Редактиране">
                                    <IconButton
                                      size="small"
                                      onClick={() => openSmtpDialog(smtp)}
                                    >
                                      <EditIcon />
                                    </IconButton>
                                  </Tooltip>
                                  {!smtp.isActive && (
                                    <Tooltip title="Активиране">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleActivateSmtp(smtp)}
                                        color="success"
                                      >
                                        <AddIcon />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                  <Tooltip title="Изтриване">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleDeleteSmtp(smtp)}
                                      color="error"
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  </Tooltip>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                  {!smtpLoading && (!smtpData?.allSmtpSettings || smtpData.allSmtpSettings.length === 0) && (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        Няма конфигурирани SMTP настройки.
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* SMTP Test Results */}
              {smtpTestResult && (
                <Alert
                  severity={smtpTestResult.success ? 'success' : 'error'}
                  onClose={() => setSmtpTestResult(null)}
                >
                  <Typography variant="body2">
                    {smtpTestResult.message}
                  </Typography>
                </Alert>
              )}
            </Box>
          </TabPanel>
        )}

        {/* Backup Settings Tab - Only for SUPER_ADMIN */}
        {user?.role === 'SUPER_ADMIN' && (
          <TabPanel value={tabValue} index={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BackupIcon />
                  Архивиране на базата данни
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    startIcon={<SettingsIcon />}
                    onClick={openBackupDialog}
                  >
                    Настройки
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={backupInProgress ? <RefreshIcon /> : <PlayArrowIcon />}
                    onClick={handleCreateManualBackup}
                    disabled={backupInProgress || !backupSettingsData?.backupSettings?.hasValidConfiguration}
                  >
                    {backupInProgress ? 'Архивиране...' : 'Ръчно архивиране'}
                  </Button>
                </Stack>
              </Box>

              {/* Backup Statistics */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StorageIcon />
                    Статистика
                  </Typography>
                  {backupStatsLoading ? (
                    <LinearProgress />
                  ) : (
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mt: 2 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Общ брой архиви
                        </Typography>
                        <Typography variant="h6" color="primary">
                          {backupStatsData?.backupStats?.totalBackups || 0}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Общ размер
                        </Typography>
                        <Typography variant="h6" color="primary">
                          {backupStatsData?.backupStats?.formattedTotalSize || '0 B'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Последен архив
                        </Typography>
                        <Typography variant="h6" color="primary">
                          {backupStatsData?.backupStats?.lastBackupAt
                            ? new Date(backupStatsData.backupStats.lastBackupAt).toLocaleString('bg-BG')
                            : 'Няма'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Статус на последен архив
                        </Typography>
                        <Chip
                          label={backupStatsData?.backupStats?.lastBackupStatus || 'Неизвестен'}
                          color={backupStatsData?.backupStats?.lastBackupStatus === 'COMPLETED' ? 'success' :
                                 backupStatsData?.backupStats?.lastBackupStatus === 'FAILED' ? 'error' : 'default'}
                          size="small"
                        />
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Автоматично архивиране
                        </Typography>
                        <Chip
                          label={backupStatsData?.backupStats?.isScheduled ? 'Активно' : 'Неактивно'}
                          color={backupStatsData?.backupStats?.isScheduled ? 'success' : 'default'}
                          size="small"
                          icon={<ScheduleIcon />}
                        />
                      </Box>
                      {backupStatsData?.backupStats?.nextBackupTime && (
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Следващ автоматичен архив
                          </Typography>
                          <Typography variant="body1">
                            {backupStatsData.backupStats.nextBackupTime}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Configuration Status */}
              {!backupSettingsData?.backupSettings?.hasValidConfiguration && (
                <Alert severity="warning">
                  <Typography variant="body2">
                    Конфигурацията за архивиране не е завършена. Моля, натиснете "Настройки" за да конфигурирате S3 хранилището.
                  </Typography>
                </Alert>
              )}

              {/* Backup History */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BackupIcon />
                    История на архивите
                  </Typography>
                  {backupHistoryLoading ? (
                    <LinearProgress />
                  ) : (
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Файл</TableCell>
                            <TableCell>Тип</TableCell>
                            <TableCell>Размер</TableCell>
                            <TableCell>Статус</TableCell>
                            <TableCell>Дата</TableCell>
                            <TableCell>Продължителност</TableCell>
                            <TableCell>Инициатор</TableCell>
                            <TableCell align="right">Действия</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(backupHistoryData?.backupHistory || []).map((backup) => (
                            <TableRow key={backup.id} hover>
                              <TableCell>
                                <Typography variant="body2" fontWeight="bold">
                                  {backup.filename}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={backup.backupType === 'MANUAL' ? 'Ръчен' : 'Автоматичен'}
                                  color={backup.backupType === 'MANUAL' ? 'info' : 'secondary'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>{backup.formattedSize}</TableCell>
                              <TableCell>
                                <Chip
                                  label={backup.status === 'COMPLETED' ? 'Завършен' :
                                         backup.status === 'FAILED' ? 'Неуспешен' :
                                         backup.status === 'IN_PROGRESS' ? 'В прогрес' : backup.status}
                                  color={backup.status === 'COMPLETED' ? 'success' :
                                         backup.status === 'FAILED' ? 'error' :
                                         backup.status === 'IN_PROGRESS' ? 'warning' : 'default'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                {backup.startedAt ? new Date(backup.startedAt).toLocaleString('bg-BG') : '-'}
                              </TableCell>
                              <TableCell>
                                {backup.durationSeconds ? `${backup.durationSeconds.toFixed(1)} сек.` : '-'}
                              </TableCell>
                              <TableCell>{backup.initiatedBy || '-'}</TableCell>
                              <TableCell align="right">
                                <Stack direction="row" spacing={1}>
                                  {backup.status === 'COMPLETED' && !backup.deletedAt && (
                                    <>
                                      <Tooltip title="Изтегляне">
                                        <IconButton
                                          size="small"
                                          onClick={() => handleDownloadBackup(backup.id)}
                                          color="primary"
                                        >
                                          <CloudDownloadIcon />
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip title="Изтриване">
                                        <IconButton
                                          size="small"
                                          onClick={() => handleDeleteBackup(backup.id)}
                                          color="error"
                                        >
                                          <DeleteIcon />
                                        </IconButton>
                                      </Tooltip>
                                    </>
                                  )}
                                </Stack>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                  {!backupHistoryLoading && (!backupHistoryData?.backupHistory || backupHistoryData.backupHistory.length === 0) && (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        Няма история на архиви.
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Backup Test Results */}
              {backupTestResult && (
                <Alert
                  severity={backupTestResult.success ? 'success' : 'error'}
                  onClose={() => setBackupTestResult(null)}
                >
                  <Typography variant="body2">
                    {backupTestResult.message}
                  </Typography>
                </Alert>
              )}
            </Box>
          </TabPanel>
        )}
      </Card>

      {/* VAT Rate Dialog */}
      <Dialog
        open={vatRateDialog}
        onClose={() => setVatRateDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingVatRate ? 'Редактиране на ДДС ставка' : 'Добавяне на ДДС ставка'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Ставка (%)"
                type="number"
                value={vatRateForm.rateValue}
                onChange={(e) => handleVatRateFormChange('rateValue', e.target.value)}
                fullWidth
                inputProps={{ min: 0, max: 100, step: 0.01 }}
                sx={{
                  // Hide the spinners on number inputs
                  '& input[type=number]': {
                    '-moz-appearance': 'textfield',
                  },
                  '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                    '-webkit-appearance': 'none',
                    margin: 0,
                  },
                }}
              />
              <TextField
                label="Подредба"
                type="number"
                value={vatRateForm.sortOrder}
                onChange={(e) => handleVatRateFormChange('sortOrder', parseInt(e.target.value) || 0)}
                fullWidth
                inputProps={{ min: 0 }}
              />
            </Box>
            <TextField
              label="Наименование"
              value={vatRateForm.rateName}
              onChange={(e) => handleVatRateFormChange('rateName', e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Английско наименование"
              value={vatRateForm.rateNameEn}
              onChange={(e) => handleVatRateFormChange('rateNameEn', e.target.value)}
              fullWidth
            />
            <TextField
              label="Описание"
              value={vatRateForm.description}
              onChange={(e) => handleVatRateFormChange('description', e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={vatRateForm.isActive}
                    onChange={(e) => handleVatRateFormChange('isActive', e.target.checked)}
                  />
                }
                label="Активна"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={vatRateForm.isDefault}
                    onChange={(e) => handleVatRateFormChange('isDefault', e.target.checked)}
                  />
                }
                label="По подразбиране"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVatRateDialog(false)} startIcon={<CancelIcon />}>
            Отказ
          </Button>
          <Button onClick={handleSaveVatRate} variant="contained" startIcon={<SaveIcon />}>
            Запиши
          </Button>
        </DialogActions>
      </Dialog>

      {/* VAT Exemption Dialog */}
      <Dialog
        open={exemptionDialog}
        onClose={() => setExemptionDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingExemption ? 'Редактиране на основание' : 'Добавяне на основание'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Код"
                value={exemptionForm.reasonCode}
                onChange={(e) => handleExemptionFormChange('reasonCode', e.target.value)}
                fullWidth
                required
              />
              <TextField
                label="Подредба"
                type="number"
                value={exemptionForm.sortOrder}
                onChange={(e) => handleExemptionFormChange('sortOrder', parseInt(e.target.value) || 0)}
                fullWidth
                inputProps={{ min: 0 }}
              />
            </Box>
            <TextField
              label="Наименование"
              value={exemptionForm.reasonName}
              onChange={(e) => handleExemptionFormChange('reasonName', e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Английско наименование"
              value={exemptionForm.reasonNameEn}
              onChange={(e) => handleExemptionFormChange('reasonNameEn', e.target.value)}
              fullWidth
            />
            <TextField
              label="Правно основание"
              value={exemptionForm.legalBasis}
              onChange={(e) => handleExemptionFormChange('legalBasis', e.target.value)}
              fullWidth
              required
              multiline
              rows={2}
            />
            <TextField
              label="Английско правно основание"
              value={exemptionForm.legalBasisEn}
              onChange={(e) => handleExemptionFormChange('legalBasisEn', e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label="Описание"
              value={exemptionForm.description}
              onChange={(e) => handleExemptionFormChange('description', e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={exemptionForm.isActive}
                  onChange={(e) => handleExemptionFormChange('isActive', e.target.checked)}
                />
              }
              label="Активно"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExemptionDialog(false)} startIcon={<CancelIcon />}>
            Отказ
          </Button>
          <Button onClick={handleSaveExemption} variant="contained" startIcon={<SaveIcon />}>
            Запиши
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete VAT Rate Confirmation Dialog */}
      <Dialog
        open={deleteVatRateDialog}
        onClose={() => setDeleteVatRateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Потвърждение за изтриване
        </DialogTitle>
        <DialogContent>
          <Typography>
            Сигурни ли сте, че искате да изтриете ДДС ставка "{deletingVatRate?.rateName}" ({deletingVatRate?.formattedRate})?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            Това действие не може да бъде отменено.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteVatRateDialog(false)}>
            Отказ
          </Button>
          <Button onClick={handleDeleteVatRate} variant="contained" color="error">
            Изтрий
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete VAT Exemption Reason Confirmation Dialog */}
      <Dialog
        open={deleteExemptionDialog}
        onClose={() => setDeleteExemptionDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Потвърждение за изтриване
        </DialogTitle>
        <DialogContent>
          <Typography>
            Сигурни ли сте, че искате да изтриете основание "{deletingExemption?.reasonName}" ({deletingExemption?.reasonCode})?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            Това действие не може да бъде отменено.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteExemptionDialog(false)}>
            Отказ
          </Button>
          <Button onClick={handleDeleteExemption} variant="contained" color="error">
            Изтрий
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Edit Dialog */}
      <Dialog
        open={userDialog}
        onClose={() => setUserDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingUser ? 'Редактиране на потребител' : 'Добавяне на потребител'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Потребителско име"
              value={userForm.username}
              onChange={(e) => handleUserFormChange('username', e.target.value)}
              fullWidth
              required
              disabled={!!editingUser}
            />
            <TextField
              label="Имейл"
              type="email"
              value={userForm.email}
              onChange={(e) => handleUserFormChange('email', e.target.value)}
              fullWidth
              required
            />
            {!editingUser && (
              <TextField
                label="Парола"
                type="password"
                value={userForm.password}
                onChange={(e) => handleUserFormChange('password', e.target.value)}
                fullWidth
                required
                helperText="Минимум 6 символа"
              />
            )}
            <FormControl fullWidth>
              <InputLabel>Роля</InputLabel>
              <Select
                value={userForm.role}
                onChange={(e) => handleUserFormChange('role', e.target.value)}
                label="Роля"
              >
                <MenuItem value="USER">Потребител</MenuItem>
                <MenuItem value="ADMIN">Администратор</MenuItem>
                <MenuItem value="SUPER_ADMIN">Супер Администратор</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Фирма</InputLabel>
              <Select
                value={userForm.companyId}
                onChange={(e) => handleUserFormChange('companyId', e.target.value)}
                label="Фирма"
              >
                <MenuItem value="">
                  <em>Няма фирма</em>
                </MenuItem>
                {(companiesData?.allCompanies || []).map((company) => (
                  <MenuItem key={company.id} value={company.id}>
                    {company.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={userForm.isActive}
                  onChange={(e) => handleUserFormChange('isActive', e.target.checked)}
                />
              }
              label="Активен потребител"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialog(false)} startIcon={<CancelIcon />}>
            Отказ
          </Button>
          <Button onClick={handleSaveUser} variant="contained" startIcon={<SaveIcon />}>
            Запиши
          </Button>
        </DialogActions>
      </Dialog>

      {/* Password Change Dialog */}
      <Dialog
        open={passwordDialog}
        onClose={() => setPasswordDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Промяна на парола за {changingPasswordUser?.username}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Нова парола"
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => handlePasswordFormChange('newPassword', e.target.value)}
              fullWidth
              required
              helperText="Минимум 6 символа"
            />
            <TextField
              label="Потвърди новата парола"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => handlePasswordFormChange('confirmPassword', e.target.value)}
              fullWidth
              required
              error={passwordForm.newPassword !== passwordForm.confirmPassword && passwordForm.confirmPassword !== ''}
              helperText={passwordForm.newPassword !== passwordForm.confirmPassword && passwordForm.confirmPassword !== '' ? 'Паролите не съвпадат' : ''}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialog(false)} startIcon={<CancelIcon />}>
            Отказ
          </Button>
          <Button
            onClick={handleChangePassword}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={passwordForm.newPassword !== passwordForm.confirmPassword || passwordForm.newPassword.length < 6}
          >
            Промени парола
          </Button>
        </DialogActions>
      </Dialog>

      {/* Company Dialog */}
      <Dialog
        open={companyDialog}
        onClose={() => setCompanyDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingCompany ? 'Редактиране на фирма' : 'Добавяне на фирма'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Име на фирмата"
              value={companyForm.name}
              onChange={(e) => handleCompanyFormChange('name', e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Английско наименование"
              value={companyForm.nameEn}
              onChange={(e) => handleCompanyFormChange('nameEn', e.target.value)}
              fullWidth
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="ЕИК"
                value={companyForm.eik}
                onChange={(e) => handleCompanyFormChange('eik', e.target.value)}
                fullWidth
              />
              <TextField
                label="ДДС номер"
                value={companyForm.vatNumber}
                onChange={(e) => handleCompanyFormChange('vatNumber', e.target.value)}
                fullWidth
              />
            </Box>
            <TextField
              label="Адрес"
              value={companyForm.address}
              onChange={(e) => handleCompanyFormChange('address', e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Телефон"
                value={companyForm.phone}
                onChange={(e) => handleCompanyFormChange('phone', e.target.value)}
                fullWidth
              />
              <TextField
                label="Имейл"
                type="email"
                value={companyForm.email}
                onChange={(e) => handleCompanyFormChange('email', e.target.value)}
                fullWidth
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Уебсайт"
                value={companyForm.website}
                onChange={(e) => handleCompanyFormChange('website', e.target.value)}
                fullWidth
              />
              <TextField
                label="Лимит потребители"
                type="number"
                value={companyForm.userLimit}
                onChange={(e) => handleCompanyFormChange('userLimit', parseInt(e.target.value) || 0)}
                fullWidth
                inputProps={{ min: 1 }}
                helperText="Максимален брой потребители за фирмата"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompanyDialog(false)} startIcon={<CancelIcon />}>
            Отказ
          </Button>
          <Button onClick={handleSaveCompany} variant="contained" startIcon={<SaveIcon />}>
            Запиши
          </Button>
        </DialogActions>
      </Dialog>

      {/* SMTP Configuration Dialog */}
      <Dialog
        open={smtpDialog}
        onClose={() => setSmtpDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingSmtp ? 'Редактиране на SMTP конфигурация' : 'Добавяне на SMTP конфигурация'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            {/* Provider Selection */}
            <FormControl fullWidth>
              <InputLabel>Провайдър</InputLabel>
              <Select
                value={smtpForm.provider}
                onChange={(e) => {
                  const provider = e.target.value;
                  handleSmtpFormChange('provider', provider);
                  
                  // Auto-fill common provider settings
                  if (provider === 'GMAIL') {
                    handleSmtpFormChange('host', 'smtp.gmail.com');
                    handleSmtpFormChange('port', 587);
                    handleSmtpFormChange('useTls', true);
                    handleSmtpFormChange('useSsl', false);
                  } else if (provider === 'OUTLOOK') {
                    handleSmtpFormChange('host', 'smtp.live.com');
                    handleSmtpFormChange('port', 587);
                    handleSmtpFormChange('useTls', true);
                    handleSmtpFormChange('useSsl', false);
                  } else if (provider === 'YAHOO') {
                    handleSmtpFormChange('host', 'smtp.mail.yahoo.com');
                    handleSmtpFormChange('port', 587);
                    handleSmtpFormChange('useTls', true);
                    handleSmtpFormChange('useSsl', false);
                  } else if (provider === 'ALICLOUD') {
                    handleSmtpFormChange('host', 'smtpdm-eu-central-1.aliyuncs.com');
                    handleSmtpFormChange('port', 465);
                    handleSmtpFormChange('useTls', false);
                    handleSmtpFormChange('useSsl', true);
                  }
                }}
                label="Провайдър"
              >
                <MenuItem value="CUSTOM">Custom SMTP</MenuItem>
                <MenuItem value="GMAIL">Gmail</MenuItem>
                <MenuItem value="OUTLOOK">Outlook/Hotmail</MenuItem>
                <MenuItem value="YAHOO">Yahoo</MenuItem>
                <MenuItem value="ALICLOUD">Alibaba Cloud DirectMail</MenuItem>
              </Select>
            </FormControl>

            {/* Host and Port */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="SMTP Host"
                value={smtpForm.host}
                onChange={(e) => handleSmtpFormChange('host', e.target.value)}
                fullWidth
                required
                placeholder="smtp.example.com"
              />
              <TextField
                label="Порт"
                type="number"
                value={smtpForm.port}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    handleSmtpFormChange('port', '');
                  } else {
                    handleSmtpFormChange('port', parseInt(value) || '');
                  }
                }}
                inputProps={{ min: 1, max: 65535 }}
                sx={{
                  minWidth: 100,
                  // Hide the spinners on number inputs
                  '& input[type=number]': {
                    '-moz-appearance': 'textfield',
                  },
                  '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                    '-webkit-appearance': 'none',
                    margin: 0,
                  },
                }}
                required
              />
            </Box>

            {/* Username and Password */}
            <TextField
              label="Потребителско име"
              value={smtpForm.username}
              onChange={(e) => handleSmtpFormChange('username', e.target.value)}
              fullWidth
              required
              placeholder="your-email@example.com"
            />
            <TextField
              label="Парола"
              type="password"
              value={smtpForm.password}
              onChange={(e) => handleSmtpFormChange('password', e.target.value)}
              fullWidth
              required={!editingSmtp}
              placeholder={editingSmtp ? "Оставете празно за запазване на текущата парола" : ""}
              helperText={editingSmtp ? "Оставете празно за запазване на текущата парола" : ""}
            />

            {/* From Email and Name */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="От имейл"
                type="email"
                value={smtpForm.fromEmail}
                onChange={(e) => handleSmtpFormChange('fromEmail', e.target.value)}
                fullWidth
                required
                placeholder="noreply@example.com"
              />
              <TextField
                label="От име"
                value={smtpForm.fromName}
                onChange={(e) => handleSmtpFormChange('fromName', e.target.value)}
                fullWidth
                placeholder="Моята фирма"
              />
            </Box>

            {/* Security Settings */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={smtpForm.useTls}
                    onChange={(e) => handleSmtpFormChange('useTls', e.target.checked)}
                  />
                }
                label="Използвай TLS"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={smtpForm.useSsl}
                    onChange={(e) => handleSmtpFormChange('useSsl', e.target.checked)}
                  />
                }
                label="Използвай SSL"
              />
            </Box>

            {/* Description */}
            <TextField
              label="Описание"
              value={smtpForm.description}
              onChange={(e) => handleSmtpFormChange('description', e.target.value)}
              fullWidth
              multiline
              rows={2}
              placeholder="Описание на SMTP конфигурацията"
            />

            {/* Common Provider Help */}
            {smtpForm.provider !== 'CUSTOM' && (
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Съвети за {smtpForm.provider}:</strong>
                  {smtpForm.provider === 'GMAIL' && (
                    <span> Използвайте App Password вместо обичайната си парола. Активирайте 2-Factor Authentication и генерирайте App Password в настройките на Gmail.</span>
                  )}
                  {smtpForm.provider === 'OUTLOOK' && (
                    <span> За Outlook/Hotmail акаунти активирайте "Less secure app access" или използвайте App Password.</span>
                  )}
                  {smtpForm.provider === 'YAHOO' && (
                    <span> За Yahoo активирайте "Less secure app access" в настройките на акаунта.</span>
                  )}
                  {smtpForm.provider === 'ALICLOUD' && (
                    <span> За Alibaba Cloud DirectMail използвайте SMTP парола (не обичайната). SMTP сървър: smtpdm-eu-central-1.aliyuncs.com, Портове: 25, 80 или 465 (SSL). Reply-to адресът трябва да бъде верифициран преди употреба. SMTP паролата влиза в сила след 2 минути.</span>
                  )}
                </Typography>
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSmtpDialog(false)} startIcon={<CancelIcon />}>
            Отказ
          </Button>
          <Button onClick={handleSaveSmtp} variant="contained" startIcon={<SaveIcon />}>
            Запиши
          </Button>
        </DialogActions>
      </Dialog>

      {/* Backup Settings Dialog */}
      <Dialog
        open={backupDialog}
        onClose={() => setBackupDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BackupIcon />
          Настройки за архивиране
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            {/* S3 Configuration */}
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              <CloudUploadIcon />
              S3 хранилище (Hetzner Object Storage)
            </Typography>

            <TextField
              label="S3 Endpoint"
              value={backupForm.s3Endpoint}
              onChange={(e) => handleBackupFormChange('s3Endpoint', e.target.value)}
              fullWidth
              required
              placeholder="https://fsn1.your-objectstorage.com"
              helperText="Hetzner Object Storage endpoint URL"
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Region"
                value={backupForm.s3Region}
                onChange={(e) => handleBackupFormChange('s3Region', e.target.value)}
                fullWidth
                required
                placeholder="eu-central-1"
              />
              <TextField
                label="Bucket Name"
                value={backupForm.s3BucketName}
                onChange={(e) => handleBackupFormChange('s3BucketName', e.target.value)}
                fullWidth
                required
                placeholder="my-backups"
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Access Key"
                value={backupForm.s3AccessKey}
                onChange={(e) => handleBackupFormChange('s3AccessKey', e.target.value)}
                fullWidth
                required
              />
              <TextField
                label="Secret Key"
                type="password"
                value={backupForm.s3SecretKey}
                onChange={(e) => handleBackupFormChange('s3SecretKey', e.target.value)}
                fullWidth
                placeholder={backupSettingsData?.backupSettings ? "Оставете празно за запазване на текущия" : ""}
                helperText={backupSettingsData?.backupSettings ? "Оставете празно за запазване на текущия ключ" : ""}
              />
            </Box>

            <TextField
              label="Backup Prefix"
              value={backupForm.backupPrefix}
              onChange={(e) => handleBackupFormChange('backupPrefix', e.target.value)}
              fullWidth
              placeholder="backup"
              helperText="Префикс за имената на файловете"
            />

            {/* Test Connection Button */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button
                variant="outlined"
                onClick={handleTestBackupConnection}
                disabled={backupTestLoading || !backupForm.s3Endpoint || !backupForm.s3BucketName || !backupForm.s3AccessKey}
                startIcon={backupTestLoading ? <RefreshIcon /> : <CloudUploadIcon />}
              >
                {backupTestLoading ? 'Тестване...' : 'Тест на връзката'}
              </Button>
              {backupTestResult && (
                <Chip
                  label={backupTestResult.success ? 'Успешна връзка' : 'Неуспешна връзка'}
                  color={backupTestResult.success ? 'success' : 'error'}
                  size="small"
                />
              )}
            </Box>

            {backupTestResult && !backupTestResult.success && (
              <Alert severity="error">
                {backupTestResult.message}
              </Alert>
            )}

            {/* Scheduling Configuration */}
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <ScheduleIcon />
              Автоматично архивиране
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={backupForm.autoBackupEnabled}
                  onChange={(e) => handleBackupFormChange('autoBackupEnabled', e.target.checked)}
                />
              }
              label="Активиране на автоматично архивиране"
            />

            {backupForm.autoBackupEnabled && (
              <TextField
                label="Cron Expression"
                value={backupForm.backupCronExpression}
                onChange={(e) => handleBackupFormChange('backupCronExpression', e.target.value)}
                fullWidth
                placeholder="0 2 * * *"
                helperText="Cron израз за планиране (напр. '0 2 * * *' = всеки ден в 02:00)"
              />
            )}

            {/* Retention Configuration */}
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <StorageIcon />
              Политика за задържане
            </Typography>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Дни за задържане"
                type="number"
                value={backupForm.retentionDays}
                onChange={(e) => handleBackupFormChange('retentionDays', parseInt(e.target.value) || 30)}
                fullWidth
                inputProps={{ min: 1, max: 365 }}
                helperText="Архивите по-стари от този брой дни ще бъдат изтрити"
              />
              <TextField
                label="Максимален брой архиви"
                type="number"
                value={backupForm.maxBackups}
                onChange={(e) => handleBackupFormChange('maxBackups', parseInt(e.target.value) || 10)}
                fullWidth
                inputProps={{ min: 1, max: 100 }}
                helperText="Максимален брой архиви за съхранение"
              />
            </Box>

            {/* Hetzner Help */}
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Съвети за Hetzner Object Storage:</strong>
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  <li>Endpoint формат: <code>https://[location].your-objectstorage.com</code></li>
                  <li>Локации: fsn1, nbg1, hel1</li>
                  <li>Създайте Access Key от Hetzner Cloud конзолата</li>
                  <li>Уверете се, че bucket-ът е създаден преди първия архив</li>
                </ul>
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBackupDialog(false)} startIcon={<CancelIcon />}>
            Отказ
          </Button>
          <Button
            onClick={handleSaveBackupSettings}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={!backupForm.s3Endpoint || !backupForm.s3BucketName || !backupForm.s3AccessKey}
          >
            Запиши
          </Button>
        </DialogActions>
      </Dialog>

      <SuccessNotification
        open={showSuccessNotification}
        onClose={() => setShowSuccessNotification(false)}
        message="Записът е запазен успешно!"
      />
    </Box>
  );
};

export default GlobalSettings;