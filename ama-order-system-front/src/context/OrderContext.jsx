import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../utils/api';

const OrderContext = createContext();

export const useOrder = () => useContext(OrderContext);

export const OrderProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]); // Takers list for Makers

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Failed to fetch orders', error);
    }
  }, [token]);

  const fetchTakers = useCallback(async () => {
    if (!token || user?.role !== 'maker') return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/takers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch takers', error);
    }
  }, [token, user]);

  useEffect(() => {
    if (token) {
      fetchOrders();
      fetchTakers();
    } else {
      setOrders([]);
      setUsers([]);
    }
  }, [token, fetchOrders, fetchTakers]);

  const createOrder = async (orderData, assignedTakerIds) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...orderData, assignedTakerIds }),
      });

      if (response.ok) {
        fetchOrders(); // Refresh list
        return true;
      }
    } catch (error) {
      console.error('Failed to create order', error);
    }
  };

  const getOrdersForUser = (userId) => {
    // In the new backend model, the API returns only relevant orders.
    // So we just return all 'orders' which are already filtered by the backend.
    return orders;
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setOrders(prev => prev.map(order =>
          order.id === orderId ? { ...order, status } : order
        ));
      }
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  const updateOrderDetails = async (orderId, details) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(details),
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        setOrders(prev => prev.map(order =>
          order.id === orderId ? updatedOrder : order
        ));
        return true;
      }
    } catch (error) {
      console.error('Failed to update details', error);
    }
  };

  const deleteOrder = async (orderId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (response.ok) {
        setOrders(prev => prev.filter(order => order.id !== orderId));
        return true;
      }
    } catch (error) {
      console.error('Failed to delete order', error);
    }
    return false;
  };

  return (
    <OrderContext.Provider value={{ orders, users, createOrder, getOrdersForUser, updateOrderStatus, updateOrderDetails, deleteOrder }}>
      {children}
    </OrderContext.Provider>
  );
};
