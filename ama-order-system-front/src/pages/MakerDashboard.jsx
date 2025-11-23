
import React, { useState } from 'react';
import { useOrder } from '../context/OrderContext';

const MakerDashboard = () => {
    const { users, createOrder, orders, updateOrderDetails, deleteOrder } = useOrder();
    const [title, setTitle] = useState('');
    const [items, setItems] = useState([{ name: '', quantity: 1 }]);
    const [selectedTakers, setSelectedTakers] = useState([]);
    const [showSuccess, setShowSuccess] = useState(false);

    // Edit State
    const [editingOrderId, setEditingOrderId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editItems, setEditItems] = useState([]);
    const [editSelectedTakers, setEditSelectedTakers] = useState([]);
    const [expandedHistoryId, setExpandedHistoryId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleAddItem = () => {
        setItems([...items, { name: '', quantity: 1 }]);
    };

    const handleRemoveItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await createOrder({ description: title, title, items }, selectedTakers);
        if (success) {
            setTitle('');
            setItems([{ name: '', quantity: 1 }]);
            setSelectedTakers([]);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        }
    };

    const handleUpdate = async (orderId) => {
        const success = await updateOrderDetails(orderId, {
            title: editTitle,
            items: editItems,
            assignedTakerIds: editSelectedTakers
        });
        if (success) {
            setEditingOrderId(null);
            setEditTitle('');
            setEditItems([]);
            setEditSelectedTakers([]);
        }
    };

    const startEditing = (order) => {
        setEditingOrderId(order.id);
        setEditTitle(order.title || '');
        setEditItems(order.Items ? order.Items.map(i => ({ name: i.name, quantity: i.quantity })) : []);
        setEditSelectedTakers(order.AssignedTakers ? order.AssignedTakers.map(t => t.id) : []);
    };

    const toggleTaker = (takerId) => {
        setSelectedTakers(prev =>
            prev.includes(takerId)
                ? prev.filter(id => id !== takerId)
                : [...prev, takerId]
        );
    };

    const toggleEditTaker = (takerId) => {
        setEditSelectedTakers(prev =>
            prev.includes(takerId)
                ? prev.filter(id => id !== takerId)
                : [...prev, takerId]
        );
    };

    // Edit Handlers
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

    // Filter Orders
    const filteredOrders = orders.filter(order => {
        const searchLower = searchTerm.toLowerCase();
        const matchesTitle = (order.title || '').toLowerCase().includes(searchLower);
        const matchesDesc = (order.description || '').toLowerCase().includes(searchLower);
        const matchesDate = new Date(order.createdAt).toLocaleDateString().includes(searchLower);
        return matchesTitle || matchesDesc || matchesDate;
    });

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1>Maker Dashboard</h1>
                <p style={{ color: 'var(--text-muted)' }}>Create and manage your orders.</p>
            </header>

            {/* Create Order Form */}
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <h2 style={{ marginBottom: '1.5rem' }}>Create New Order</h2>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Order Title</label>
                        <input
                            type="text"
                            className="input-field"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Monthly Supply Restock"
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Items</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {items.map((item, index) => (
                                <div key={index} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Product Name"
                                        value={item.name}
                                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                                        required
                                        style={{ flex: 2 }}
                                    />
                                    <input
                                        type="number"
                                        className="input-field"
                                        placeholder="Qty"
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                                        min="1"
                                        required
                                        style={{ flex: 0.5 }}
                                    />
                                    {items.length > 1 && (
                                        <button type="button" onClick={() => handleRemoveItem(index)} className="btn-secondary" style={{ color: '#ef4444', borderColor: '#ef4444' }}>
                                            ✕
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button type="button" onClick={handleAddItem} className="btn-secondary" style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}>
                                + Add Item
                            </button>
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Assign Takers</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {users.filter(u => u.role === 'taker').map(taker => (
                                <button
                                    key={taker.id}
                                    type="button"
                                    onClick={() => toggleTaker(taker.id)}
                                    className={`btn-secondary ${selectedTakers.includes(taker.id) ? 'active' : ''}`}
                                    style={{
                                        borderColor: selectedTakers.includes(taker.id) ? 'var(--primary)' : 'var(--glass-border)',
                                        background: selectedTakers.includes(taker.id) ? 'rgba(251, 191, 36, 0.1)' : 'transparent'
                                    }}
                                >
                                    {taker.name || taker.username} <span style={{ opacity: 0.5, fontSize: '0.8em' }}>(ID: {taker.id})</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
                        🚀 Send Order
                    </button>
                </form>
            </div>

            {showSuccess && (
                <div className="glass-panel fade-in" style={{
                    marginTop: '2rem',
                    padding: '1rem',
                    background: 'rgba(16, 185, 129, 0.2)',
                    borderColor: 'rgba(16, 185, 129, 0.4)',
                    color: '#34d399',
                    textAlign: 'center'
                }}>
                    Order created successfully!
                </div>
            )}

            <div style={{ marginTop: '3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2>Order History</h2>
                    <input
                        type="text"
                        placeholder="Search orders..."
                        className="input-field"
                        style={{ width: '250px' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {filteredOrders.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No orders found.</p>
                    ) : (
                        filteredOrders.map(order => (
                            <div key={order.id} className="glass-panel" style={{ padding: '1.5rem' }}>
                                <div className="order-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span style={{ fontFamily: 'monospace', background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                            #{String(order.id).padStart(6, '0')}
                                        </span>
                                        {editingOrderId === order.id ? (
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                                placeholder="Order Title"
                                                style={{ padding: '0.2rem 0.5rem', fontSize: '1rem' }}
                                            />
                                        ) : (
                                            <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{order.title || 'Untitled Order'}</span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <span style={{
                                            color: order.status === 'completed' ? '#34d399' : order.status === 'in-progress' ? '#fbbf24' : '#94a3b8',
                                            textTransform: 'capitalize'
                                        }}>
                                            {order.status}
                                        </span>
                                        {editingOrderId !== order.id && (
                                            <>
                                                <button onClick={() => startEditing(order)} className="btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}>
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
                                                            deleteOrder(order.id);
                                                        }
                                                    }}
                                                    className="btn-secondary"
                                                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', color: '#ef4444', borderColor: '#ef4444' }}
                                                >
                                                    Delete
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {editingOrderId === order.id ? (
                                    <div style={{ marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
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

                                        <div style={{ marginTop: '1.5rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Assigned Takers</label>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                {users.filter(u => u.role === 'taker').map(taker => (
                                                    <button
                                                        key={taker.id}
                                                        type="button"
                                                        onClick={() => toggleEditTaker(taker.id)}
                                                        className={`btn-secondary ${editSelectedTakers.includes(taker.id) ? 'active' : ''}`}
                                                        style={{
                                                            borderColor: editSelectedTakers.includes(taker.id) ? 'var(--primary)' : 'var(--glass-border)',
                                                            background: editSelectedTakers.includes(taker.id) ? 'rgba(251, 191, 36, 0.1)' : 'transparent',
                                                            fontSize: '0.8rem',
                                                            padding: '0.3rem 0.6rem'
                                                        }}
                                                    >
                                                        {taker.name || taker.username}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                            <button onClick={() => handleUpdate(order.id)} className="btn-primary" style={{ padding: '0.5rem 1rem' }}>Save Changes</button>
                                            <button onClick={() => setEditingOrderId(null)} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {order.description && !order.description.startsWith('Order with') && (
                                            <p style={{ fontSize: '1rem', marginBottom: '1rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>{order.description}</p>
                                        )}

                                        {order.Items && order.Items.length > 0 && (
                                            <table className="order-items-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
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
                                        )}
                                    </>
                                )}

                                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    Assigned to: <span style={{ color: 'var(--text-main)' }}>
                                        {order.AssignedTakers?.map(t => t.username).join(', ') || 'None'}
                                    </span>
                                </div>

                                {order.History && order.History.length > 0 && (
                                    <div style={{ marginTop: '1rem' }}>
                                        <button
                                            onClick={() => setExpandedHistoryId(expandedHistoryId === order.id ? null : order.id)}
                                            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, fontSize: '0.9rem' }}
                                        >
                                            {expandedHistoryId === order.id ? 'Hide History' : `View Edit History(${order.History.length})`}
                                        </button>

                                        {expandedHistoryId === order.id && (
                                            <div style={{ marginTop: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '1rem' }}>
                                                {order.History.map(log => {
                                                    let logColor = 'var(--text-main)';
                                                    let icon = '📝';

                                                    if (log.newDescription.startsWith('Added:')) {
                                                        logColor = '#34d399'; // Green
                                                        icon = '➕';
                                                    } else if (log.newDescription.startsWith('Removed:')) {
                                                        logColor = '#ef4444'; // Red
                                                        icon = '❌';
                                                    } else if (log.newDescription.startsWith('Updated')) {
                                                        logColor = '#fbbf24'; // Yellow
                                                        icon = '🔄';
                                                    } else if (log.newDescription.startsWith('Title:')) {
                                                        logColor = '#60a5fa'; // Blue
                                                        icon = '🏷️';
                                                    }

                                                    return (
                                                        <div key={log.id} style={{ marginBottom: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                                                                <span>{new Date(log.createdAt).toLocaleString()}</span>
                                                                <span style={{ fontStyle: 'italic' }}>by {log.Editor ? log.Editor.username : 'Unknown'}</span>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: logColor, fontSize: '0.9rem' }}>
                                                                <span>{icon}</span>
                                                                <span>{log.newDescription}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default MakerDashboard;
