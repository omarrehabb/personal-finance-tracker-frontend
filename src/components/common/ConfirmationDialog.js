import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  Avatar,
  Divider
} from '@mui/material';
import {
  Warning as WarningIcon,
  Delete as DeleteIcon,
  LinkOff as DisconnectIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

const ConfirmationDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  type = 'warning', // 'warning', 'danger', 'info'
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false
}) => {
  const getIconAndColor = () => {
    switch (type) {
      case 'danger':
        return { icon: <DeleteIcon />, color: 'error.main', bgColor: 'error.light' };
      case 'warning':
        return { icon: <WarningIcon />, color: 'warning.main', bgColor: 'warning.light' };
      case 'disconnect':
        return { icon: <DisconnectIcon />, color: 'error.main', bgColor: 'error.light' };
      default:
        return { icon: <ErrorIcon />, color: 'info.main', bgColor: 'info.light' };
    }
  };

  const { icon, color, bgColor } = getIconAndColor();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'visible'
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pt: 3, pb: 1 }}>
        <Avatar
          sx={{
            width: 64,
            height: 64,
            bgcolor: bgColor,
            color: color,
            mx: 'auto',
            mb: 2
          }}
        >
          {icon}
        </Avatar>
        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ textAlign: 'center', px: 3 }}>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          {message}
        </Typography>
        
        {type === 'danger' && (
          <Box
            sx={{
              p: 2,
              bgcolor: 'error.50',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'error.200'
            }}
          >
            <Typography variant="body2" color="error.main" sx={{ fontWeight: 500 }}>
              This action cannot be undone
            </Typography>
          </Box>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={loading}
          sx={{ flex: 1 }}
        >
          {cancelText}
        </Button>
        
        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={loading}
          color={type === 'danger' || type === 'disconnect' ? 'error' : 'primary'}
          sx={{
            flex: 1,
            ...(type === 'danger' || type === 'disconnect'
              ? {
                  background: 'linear-gradient(45deg, #ff6b9d 30%, #ff4081 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #ff5722 30%, #e91e63 90%)',
                  }
                }
              : {
                  background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
                  }
                })
          }}
        >
          {loading ? 'Processing...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog;