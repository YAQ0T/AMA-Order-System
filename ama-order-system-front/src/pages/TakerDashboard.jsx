import React, { useState } from 'react';
import { useOrder } from '../context/OrderContext';

const TakerDashboard = () => {
    const { orders, updateOrderStatus, updateOrderDetails, fetchOrders } = useOrder();
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Auto-refresh orders every 15 seconds
    React.useEffect(() => {
        const interval = setInterval(() => {
            fetchOrders();
        }, 15000);
        return () => clearInterval(interval);
    }, [fetchOrders]);

    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        await fetchOrders();
        setTimeout(() => setIsRefreshing(false), 500);
    };

    // Filter out completed orders
    const activeOrders = orders.filter(order => order.status !== 'completed');

    // Edit State
    const [editingOrderId, setEditingOrderId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editItems, setEditItems] = useState([]);

    const handleStatusChange = (orderId, newStatus) => {
        updateOrderStatus(orderId, newStatus);
    };

    // Edit Handlers
    const startEditing = (order) => {
        setEditingOrderId(order.id);
        setEditTitle(order.title || '');
        setEditItems(order.Items ? order.Items.map(i => ({ name: i.name, quantity: i.quantity })) : []);
    };

    const handleEditAddItem = () => {
        setEditItems([...editItems, { name: '', quantity: 1 }]);
    };

    const handleEditRemoveItem = (index) => {
        setEditItems(editItems.filter((_, i) => i !== index));
    };

    const handleEditItemChange = (index, field, value) => {
        const newItems = [...editItems];
        newItems[index][field] = value;
        setEditItems(newItems);
    };

    const handleUpdate = async (orderId) => {
        if (window.confirm("Warning: You are modifying the Maker's order. Are you sure?")) {
            const success = await updateOrderDetails(orderId, { title: editTitle, items: editItems });
            if (success) {
                setEditingOrderId(null);
                setEditTitle('');
                setEditItems([]);
            }
        }
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {activeOrders.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>No active orders assigned to you.</p>
                    </div>
                ) : (
                    activeOrders.map(order => {
                        const isAdminOrder = order.Maker?.role === 'admin';
                        const statusColor = order.status === 'completed' ? '#34d399' : order.status === 'in-progress' ? '#fbbf24' : '#94a3b8';
                        const borderColor = isAdminOrder ? '#ef4444' : statusColor;

                        return (
                            <div key={order.id} className="glass-panel" style={{ padding: '1.5rem', borderLeft: `4px solid ${borderColor}` }}>
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
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <select
                                            value={order.status}
                                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                            className="input-field"
                                            style={{ padding: '0.3rem', fontSize: '0.9rem', width: 'auto' }}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="in-progress">In Progress</option>
                                            <option value="completed">Completed</option>
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
                                                <div key={index} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                    <input
                                                        type="text"
                                                        className="input-field"
                                                        placeholder="Product Name"
                                                        value={item.name}
                                                        onChange={(e) => handleEditItemChange(index, 'name', e.target.value)}
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
                                                    <button type="button" onClick={() => handleEditRemoveItem(index)} className="btn-secondary" style={{ color: '#ef4444', borderColor: '#ef4444' }}>
                                                        ✕
                                                    </button>
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
                                            <button onClick={() => setEditingOrderId(null)} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>Cancel</button>
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
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {order.Items.map(item => (
                                                            <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                                <td className="item-name" style={{ padding: '0.5rem' }}>{item.name}</td>
                                                                <td className="item-qty" style={{ padding: '0.5rem', textAlign: 'right' }}>{item.quantity}</td>
                                                            </tr>
                                                        ))}
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
