import React from 'react';
import { 
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  IconButton,
  Box,
  Divider,
  Chip
} from '@mui/material';
import {
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  DeleteOutline as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import transactionService from '../../services/transaction.service';

const TransactionList = ({ transactions, onRefresh, allowActions = false }) => {
  const navigate = useNavigate();

  const handleEdit = (id) => {
    navigate(`/transactions/edit/${id}`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await transactionService.deleteTransaction(id);
        if (onRefresh) {
          onRefresh();
        }
      } catch (err) {
        console.error('Error deleting transaction:', err);
        alert('Failed to delete transaction');
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
      {transactions.map((transaction, index) => (
        <React.Fragment key={transaction.id}>
          {index > 0 && <Divider variant="inset" component="li" />}
          <ListItem
            alignItems="flex-start"
            secondaryAction={
              allowActions && (
                <Box>
                  <IconButton edge="end" aria-label="edit" onClick={() => handleEdit(transaction.id)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(transaction.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              )
            }
          >
            <ListItemAvatar>
              <Avatar sx={{ 
                bgcolor: transaction.transaction_type === 'income' ? 'success.main' : 'error.main' 
              }}>
                {transaction.transaction_type === 'income' ? <IncomeIcon /> : <ExpenseIcon />}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" component="span">
                    {transaction.description || transaction.category}
                  </Typography>
                  <Typography 
                    variant="subtitle1" 
                    component="span"
                    sx={{ 
                      fontWeight: 'bold',
                      color: transaction.transaction_type === 'income' ? 'success.main' : 'error.main'
                    }}
                  >
                    {transaction.transaction_type === 'income' ? '+' : '-'}${transaction.amount}
                  </Typography>
                </Box>
              }
              secondary={
                <React.Fragment>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Box>
                      <Typography
                        sx={{ display: 'inline' }}
                        component="span"
                        variant="body2"
                        color="text.primary"
                      >
                        {formatDate(transaction.date)}
                      </Typography>
                      {transaction.description && (
                        <Typography
                          sx={{ display: 'block' }}
                          component="span"
                          variant="body2"
                          color="text.secondary"
                        >
                          {transaction.description}
                        </Typography>
                      )}
                    </Box>
                    <Chip 
                      label={transaction.category} 
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Box>
                </React.Fragment>
              }
            />
          </ListItem>
        </React.Fragment>
      ))}
    </List>
  );
};

export default TransactionList;