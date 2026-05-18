import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Snackbar, Alert, Backdrop, CircularProgress, Button } from '@mui/material';

const FeedbackContext = createContext(null);

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};

export function FeedbackProvider({ children }) {
  /** @type {[ {open: boolean, message: string, severity: "success" | "info" | "warning" | "error", actionLabel: string | null, actionCallback: (() => void) | null}, Function ]} */
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: /** @type {"success" | "info" | "warning" | "error"} */ ('info'),
    actionLabel: /** @type {string | null} */ (null),
    actionCallback: /** @type {(() => void) | null} */ (null),
  });

  const actionRef = useRef(null);

  const [loading, setLoading] = useState(false);

  /**
   * @param {string} message
   * @param {"success" | "info" | "warning" | "error"} severity
   * @param {string} [actionLabel] - 操作按钮文字
   * @param {() => void} [actionCallback] - 操作按钮回调
   */
  const showMessage = useCallback((message, severity = /** @type {"success"|"info"|"warning"|"error"} */ ('info'), actionLabel, actionCallback) => {
    if (actionCallback) {
      actionRef.current = actionCallback;
    }
    setSnackbar({
      open: true,
      message,
      severity,
      actionLabel: actionLabel || null,
      actionCallback: actionCallback || null,
    });
  }, []);

  const handleAction = useCallback(() => {
    if (actionRef.current) {
      actionRef.current();
    }
    setSnackbar((prev) => ({ ...prev, open: false }));
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
        autoHideDuration={snackbar.actionCallback ? 5000 : 4000}
        onClose={hideMessage}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={hideMessage} 
          severity={snackbar.severity} 
          sx={{ width: '100%', boxShadow: 3 }}
          variant="filled"
          action={
            snackbar.actionLabel ? (
              <Button 
                color="inherit" 
                size="small" 
                onClick={handleAction}
                sx={{ fontWeight: 700 }}
              >
                {snackbar.actionLabel}
              </Button>
            ) : null
          }
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
