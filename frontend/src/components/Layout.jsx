import React, { useState } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Description as DocumentIcon,
  People as ClientIcon,
  Inventory as ItemIcon,
  Assessment as ReportsIcon,
  Business as CompanyIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  SwapHoriz as SwapHorizIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client';
import { useCompany } from '../context/CompanyContext';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeContext';
import { LOGOUT_MUTATION } from '../graphql/mutations';
import { GET_COMPANY_DETAILS } from '../graphql/queries';

const drawerWidth = 240;

const Layout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { activeCompanyId } = useCompany();
  const { user, logout } = useAuth();
  const { mode, toggleTheme, isDark } = useThemeMode();
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Query company details based on activeCompanyId (for SUPER_ADMIN who can switch companies)
  const { data: companyData } = useQuery(GET_COMPANY_DETAILS, {
    variables: { id: activeCompanyId },
    skip: !activeCompanyId,
  });

  // For SUPER_ADMIN use queried company, for others use user's company
  const activeCompany = isSuperAdmin
    ? (companyData?.companyById || null)
    : (user?.company || null);

  const [logoutMutation] = useMutation(LOGOUT_MUTATION, {
    onCompleted: () => {
      logout();
      navigate('/login');
    },
    onError: (error) => {
      console.error('Logout error:', error);
      // Force logout even if server request fails
      logout();
      navigate('/login');
    }
  });

  const handleLogout = async () => {
    try {
      await logoutMutation();
    } catch (error) {
      // Error handled in onError callback
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Build menu items - some items only for SUPER_ADMIN
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Документи', icon: <DocumentIcon />, path: '/documents' },
    { text: 'Клиенти', icon: <ClientIcon />, path: '/clients' },
    { text: 'Артикули', icon: <ItemIcon />, path: '/items' },
    { text: 'Справки', icon: <ReportsIcon />, path: '/reports' },
    // Only SUPER_ADMIN can switch companies
    ...(isSuperAdmin ? [{ text: 'Смени фирма', icon: <SwapHorizIcon />, path: '/select-company' }] : []),
    { text: 'Настройки фирма', icon: <CompanyIcon />, path: '/company' },
    // Only SUPER_ADMIN can access global settings
    ...(isSuperAdmin ? [{ text: 'Глобални настройки', icon: <SettingsIcon />, path: '/global-settings' }] : []),
  ];

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Bash Inv
        </Typography>
      </Toolbar>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                if (isMobile) {
                  setMobileOpen(false);
                }
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          {/* Active Company Display */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
            <CompanyIcon sx={{ color: 'white' }} />
            <Box>
              <Typography variant="body1" fontWeight="bold" sx={{ color: 'white', lineHeight: 1.2 }}>
                {activeCompany?.name || 'Зареждане...'}
              </Typography>
              {activeCompany?.eik && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  ЕИК: {activeCompany.eik}
                </Typography>
              )}
            </Box>
            {/* Only SUPER_ADMIN can switch companies */}
            {isSuperAdmin && (
              <Button
                component={Link}
                to="/select-company"
                size="small"
                variant="outlined"
                startIcon={<SwapHorizIcon />}
                sx={{
                  ml: 1,
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                Смени
              </Button>
            )}
          </Box>
          
          {/* Theme Toggle, User Info and Logout */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              color="inherit"
              onClick={toggleTheme}
              title={isDark ? 'Светла тема' : 'Тъмна тема'}
            >
              {isDark ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
            {user && (
              <Typography variant="body2" sx={{ color: 'white', ml: 1 }}>
                {user.username} ({user.role})
              </Typography>
            )}
            <Button
              color="inherit"
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
              sx={{ color: 'white' }}
            >
              Изход
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { md: `calc(100% - ${drawerWidth}px)` } }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default Layout;