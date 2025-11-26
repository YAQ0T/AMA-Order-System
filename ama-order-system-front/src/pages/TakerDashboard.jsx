import React, { useMemo, useState } from 'react';
import { useOrder } from '../context/OrderContext';
import { updateItemStatus } from '../utils/api';

const TakerDashboard = () => {
    const { orders, orderPagination, updateOrderStatus, updateOrderDetails, fetchOrders } = useOrder();
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Auto-refresh orders every 15 seconds
    React.useEffect(() => {
        const interval = setInterval(() => {
            fetchOrders({ limit: orderPagination.limit, offset: orderPagination.offset });
        }, 15000);
        return () => clearInterval(interval);
    }, [fetchOrders, orderPagination.limit, orderPagination.offset]);

    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        await fetchOrders({ limit: orderPagination.limit, offset: orderPagination.offset });
        setTimeout(() => setIsRefreshing(false), 500);
    };

    // Hide ERP-entered orders and filter out completed entries
    const visibleOrders = orders.filter(order => order.status !== 'entered_erp');
    const activeOrders = visibleOrders.filter(order => order.status !== 'completed');
    const orderedActiveOrders = useMemo(
        () => [...activeOrders].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
        [activeOrders]
    );

    // Edit State
    const [editingOrderId, setEditingOrderId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editItems, setEditItems] = useState([]);
    const [editingItemId, setEditingItemId] = useState(null);

    const handleStatusChange = (orderId, newStatus) => {
        updateOrderStatus(orderId, newStatus);
    };

    const limit = orderPagination.limit || 20;
    const totalOrders = orderPagination.total || visibleOrders.length;
    const totalPages = Math.max(1, Math.ceil(totalOrders / limit));
    const currentPage = Math.min(Math.floor((orderPagination.offset || 0) / limit) + 1, totalPages);
    const pageStart = totalOrders === 0 ? 0 : (currentPage - 1) * limit + 1;
    const pageEnd = Math.min(totalOrders, currentPage * limit);

    const handlePageChange = (page) => {
        const newPage = Math.min(Math.max(page, 1), totalPages);
        fetchOrders({ limit, offset: (newPage - 1) * limit });
    };

    // Item Status Handlers
    const handleItemStatusChange = async (itemId, newStatus) => {
        console.log('Updating item status:', { itemId, newStatus });
        try {
            const result = await updateItemStatus(itemId, newStatus);
            console.log('Status update successful:', result);

            // Small delay to ensure database transaction completes
            await new Promise(resolve => setTimeout(resolve, 300));

            console.log('About to fetch orders...');
            // Fetch fresh data from server
            await fetchOrders({ limit: orderPagination.limit, offset: orderPagination.offset });
            console.log('Orders refreshed, current orders:', orders);
        } catch (error) {
            console.error('Failed to update item status:', error);
            alert('Failed to update item status. Please try again.');
        }
    };

    // Edit Handlers
    const startEditing = (order, targetItemId = null) => {
        setEditingOrderId(order.id);
        setEditTitle(order.title || '');
        setEditItems(order.Items ? order.Items.map(i => ({ id: i.id, name: i.name, quantity: i.quantity })) : []);
        setEditingItemId(targetItemId);
    };

    React.useEffect(() => {
        if (!editingOrderId || !editingItemId) return;

        const input = document.getElementById(`edit-item-${editingOrderId}-${editingItemId}`);
        if (input) {
            input.focus();
        }
    }, [editingOrderId, editingItemId, editItems]);

    const handleEditAddItem = () => {
        setEditItems([...editItems, { name: '', quantity: 1 }]);
    };

    const handleEditItemChange = (index, field, value) => {
        const newItems = [...editItems];
        newItems[index][field] = value;
        setEditItems(newItems);
    };

    const handleUpdate = async (orderId) => {
        if (window.confirm("Warning: You are modifying the Maker's order. Are you sure?")) {
            const itemsPayload = editItems.map(({ name, quantity, price }) => ({ name, quantity, price }));
            const success = await updateOrderDetails(orderId, { title: editTitle, items: itemsPayload });
            if (success) {
                cancelEditing();
            }
        }
    };

    const cancelEditing = () => {
        setEditingOrderId(null);
        setEditTitle('');
        setEditItems([]);
        setEditingItemId(null);
    };

    return (
        <div className="taker-dashboard" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h1>My Assigned Orders</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage and update your tasks.</p>
                </div>
                <button
                    onClick={handleManualRefresh}
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    disabled={isRefreshing}
                >
                    <span style={{
                        display: 'inline-block',
                        transform: isRefreshing ? 'rotate(360deg)' : 'none',
                        transition: 'transform 0.5s ease'
                    }}>🔄</span>
                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            </header>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                    Showing {pageStart}-{pageEnd} of {totalOrders} orders
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                        className="btn-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.9rem', opacity: currentPage === 1 ? 0.6 : 1 }}
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>
                    <span style={{ color: 'var(--text-muted)', minWidth: '90px', textAlign: 'center', fontSize: '0.95rem' }}>
                        Page {currentPage} / {totalPages}
                    </span>
                    <button
                        className="btn-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.9rem', opacity: currentPage === totalPages ? 0.6 : 1 }}
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {orderedActiveOrders.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>No active orders assigned to you.</p>
                    </div>
                ) : (
                    orderedActiveOrders.map(order => {
                        const isAdminOrder = order.Maker?.role === 'admin';
                        const statusColor = order.status === 'completed' ? '#34d399' :
                            order.status === 'in-progress' ? '#fbbf24' :
                                order.status === 'entered_erp' ? '#8b5cf6' : '#94a3b8';
                        const borderColor = isAdminOrder ? '#ef4444' : statusColor;

                        return (
                            <div key={order.id} className="glass-panel taker-order-card" style={{ padding: '1.5rem', borderLeft: `4px solid ${borderColor}` }}>
                                <div className="order-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span style={{ fontFamily: 'monospace', background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                            #{String(order.id).padStart(6, '0')}
                                        </span>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </span>
                                        {isAdminOrder && (
                                            <span style={{ color: '#ef4444', fontWeight: '600', fontSize: '0.9rem' }}>
                                                Admin Order
                                            </span>
                                        )}
                                    </div>
                                    <div className="order-controls" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <select
                                            value={order.status}
                                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                            className="input-field"
                                            style={{ padding: '0.3rem', fontSize: '0.9rem', width: 'auto' }}
                                            disabled={order.status === 'entered_erp'}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="in-progress">In Progress</option>
                                            <option value="completed">Completed</option>
                                            {order.status === 'entered_erp' && (
                                                <option value="entered_erp">Entered into ERP</option>
                                            )}
                                        </select>
                                        {editingOrderId !== order.id && (
                                            <button onClick={() => startEditing(order)} className="btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}>
                                                Edit
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {editingOrderId === order.id ? (
                                    <div style={{ marginBottom: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Customer Name</label>
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                                placeholder="Customer name"
                                                style={{ fontSize: '0.9rem' }}
                                            /></div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Items</label>
                                            {editItems.map((item, index) => (
                                                <div key={item.id || index} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                    <input
                                                        type="text"
                                                        className="input-field"
                                                        placeholder="Product Name"
                                                        value={item.name}
                                                        onChange={(e) => handleEditItemChange(index, 'name', e.target.value)}
                                                        id={item.id ? `edit-item-${order.id}-${item.id}` : undefined}
                                                        style={{ flex: 2 }}
                                                    />
                                                    <input
                                                        type="number"
                                                        className="input-field"
                                                        placeholder="Qty"
                                                        value={item.quantity}
                                                        onChange={(e) => handleEditItemChange(index, 'quantity', parseInt(e.target.value))}
                                                        min="1"
                                                        style={{ flex: 0.5 }}
                                                    />
                                                </div>
                                            ))}
                                            <button type="button" onClick={handleEditAddItem} className="btn-secondary" style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}>
                                                + Add Item
                                            </button>
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button onClick={() => handleUpdate(order.id)} className="btn-primary" style={{ padding: '0.5rem 1rem', background: '#fbbf24', color: '#000' }}>
                                                ⚠️ Save Changes
                                            </button>
                                            <button onClick={cancelEditing} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{order.title || 'Untitled Order'}</span>
                                            {order.city && (
                                                <span style={{ marginLeft: '1rem', fontSize: '0.9rem', color: 'var(--primary)', background: 'rgba(251, 191, 36, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                                    🏙️ {order.city}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '1rem' }}>
                                            {order.Items && order.Items.length > 0 ? (
                                                <table className="order-items-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem' }}>
                                                    <thead>
                                                        <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                                                            <th style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>Product</th>
                                                            <th style={{ padding: '0.5rem', color: 'var(--text-muted)', textAlign: 'right' }}>Qty</th>
                                                            <th style={{ padding: '0.5rem', color: 'var(--text-muted)', textAlign: 'center' }}>Status</th>
                                                            <th style={{ padding: '0.5rem', color: 'var(--text-muted)', textAlign: 'center' }}>Edit</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {[...(order.Items || [])]
                                                            .sort((a, b) => a.id - b.id)
                                                            .map(item => {
                                                                const getRowStyle = () => {
                                                                    const baseStyle = {
                                                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                                        transition: 'background-color 0.3s ease',
                                                                        borderLeft: '3px solid transparent'
                                                                    };

                                                                    if (item.status === 'collected') {
                                                                        return {
                                                                            ...baseStyle,
                                                                            backgroundColor: 'rgba(52, 211, 153, 0.15)',
                                                                            borderLeft: '3px solid #34d399'
                                                                        };
                                                                    } else if (item.status === 'unavailable') {
                                                                        return {
                                                                            ...baseStyle,
                                                                            backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                                                            borderLeft: '3px solid #ef4444'
                                                                        };
                                                                    }
                                                                    return baseStyle;
                                                                };

                                                                return (
                                                                    <tr key={item.id} style={getRowStyle()}>
                                                                        <td className="item-name" style={{
                                                                            padding: '0.5rem',
                                                                            textDecoration: item.status === 'unavailable' ? 'line-through' : 'none',
                                                                            opacity: item.status === 'unavailable' ? 0.6 : 1
                                                                        }}>{item.name}</td>
                                                                        <td className="item-qty" style={{
                                                                            padding: '0.5rem',
                                                                            textAlign: 'right',
                                                                            opacity: item.status === 'unavailable' ? 0.6 : 1
                                                                        }}>{item.quantity}</td>
                                                                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                                                            <div className="status-actions" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                                                <button
                                                                                    onClick={() => handleItemStatusChange(item.id, item.status === 'collected' ? null : 'collected')}
                                                                                    className="btn-secondary status-action-btn"
                                                                                    style={{
                                                                                        padding: '0.3rem 0.6rem',
                                                                                        fontSize: '0.9rem',
                                                                                        background: item.status === 'collected' ? '#34d399' : 'transparent',
                                                                                        borderColor: item.status === 'collected' ? '#34d399' : 'var(--glass-border)',
                                                                                        color: item.status === 'collected' ? '#000' : 'var(--text-main)'
                                                                                    }}
                                                                                    title="Mark as collected"
                                                                                >
                                                                                    ✓
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleItemStatusChange(item.id, item.status === 'unavailable' ? null : 'unavailable')}
                                                                                    className="btn-secondary status-action-btn"
                                                                                    style={{
                                                                                        padding: '0.3rem 0.6rem',
                                                                                        fontSize: '0.9rem',
                                                                                        background: item.status === 'unavailable' ? '#ef4444' : 'transparent',
                                                                                        borderColor: item.status === 'unavailable' ? '#ef4444' : 'var(--glass-border)',
                                                                                        color: item.status === 'unavailable' ? '#fff' : 'var(--text-main)'
                                                                                    }}
                                                                                    title="Mark as unavailable"
                                                                                >
                                                                                    ✕
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                                                            <button
                                                                                onClick={() => startEditing(order, item.id)}
                                                                                className="btn-secondary"
                                                                                style={{ padding: '0.3rem 0.5rem', fontSize: '0.9rem' }}
                                                                                title="Edit this product"
                                                                            >
                                                                                ✏️
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                order.description
                                            )}
                                        </div>
                                        {order.Items && order.Items.length > 0 && order.description && !order.description.startsWith('Order with') && (
                                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.5rem' }}>Note: {order.description}</p>
                                        )}
                                    </>
                                )}
                                {order.Maker && (
                                    <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        Created by: <span style={{ color: isAdminOrder ? '#ef4444' : 'var(--text-main)' }}>{order.Maker.username}</span>
                                    </p>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default TakerDashboard;
