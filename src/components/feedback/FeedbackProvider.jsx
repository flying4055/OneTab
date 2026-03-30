import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, Backdrop, CircularProgress } from '@mui/material';

const FeedbackContext = createContext(null);

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};

export function FeedbackProvider({ children }) {
  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info', // 'error' | 'warning' | 'info' | 'success'
  });

  // Loading state
  const [loading, setLoading] = useState(false);

  const showMessage = useCallback((message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  }, []);

  const hideMessage = useCallback((event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const showLoading = useCallback(() => setLoading(true), []);
  const hideLoading = useCallback(() => setLoading(false), []);

  return (
    <FeedbackContext.Provider value={{ showMessage, showLoading, hideLoading }}>
      {children}
      
      {/* Global Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={hideMessage}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={hideMessage} 
          severity={snackbar.severity} 
          sx={{ width: '100%', boxShadow: 3 }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Global Loading Backdrop */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 999 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </FeedbackContext.Provider>
  );
}
