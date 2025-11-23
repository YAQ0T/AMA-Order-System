import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../utils/api';

const AdminDashboard = () => {
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expandedOrderId, setExpandedOrderId] = useState(null);

    // Fetch stats
    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (err) {
            console.error('Failed to fetch stats', err);
        }
    };

    // Delete order
    const deleteOrder = async (orderId) => {
        if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                alert('Order deleted successfully');
                fetchOrders();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete order');
            }
        } catch (err) {
            console.error('Failed to delete order', err);
            alert('Failed to delete order');
        }
    };

    // Fetch all users
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (err) {
            console.error('Failed to fetch users', err);
        }
        setLoading(false);
    };

    // Fetch pending users
    const fetchPendingUsers = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/users/pending`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPendingUsers(data);
            }
        } catch (err) {
            console.error('Failed to fetch pending users', err);
        }
    };

    // Fetch all orders
    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            }
        } catch (err) {
            console.error('Failed to fetch orders', err);
        }
        setLoading(false);
    };

    // Fetch activity logs
    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/logs?limit=50`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setLogs(data);
            }
        } catch (err) {
            console.error('Failed to fetch logs', err);
        }
        setLoading(false);
    };

    // Approve user
    const approveUser = async (userId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/approve`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                alert('User approved successfully!');
                fetchPendingUsers();
                fetchUsers();
                fetchStats();
            }
        } catch (err) {
            console.error('Failed to approve user', err);
            alert('Failed to approve user');
        }
    };

    // Delete user
    const deleteUser = async (userId, username) => {
        if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                alert('User deleted successfully!');
                fetchUsers();
                fetchStats();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete user');
            }
        } catch (err) {
            console.error('Failed to delete user', err);
            alert('Failed to delete user');
        }
    };

    useEffect(() => {
        fetchStats();
        fetchPendingUsers();
    }, []);

    useEffect(() => {
        if (activeTab === 'users') fetchUsers();
        else if (activeTab === 'orders') fetchOrders();
        else if (activeTab === 'logs') fetchLogs();
    }, [activeTab]);

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'admin': return '#ec4899';
            case 'maker': return '#6366f1';
            case 'taker': return '#22c55e';
            default: return '#94a3b8';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return '#f59e0b';
            case 'in-progress': return '#3b82f6';
            case 'completed': return '#22c55e';
            case 'cancelled': return '#ef4444';
            default: return '#94a3b8';
        }
    };

    return (
        <div className="container fade-in">
            <h1 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>👑</span> Admin Dashboard
            </h1>

            {/* Tabs */}
            <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '2rem',
                flexWrap: 'wrap'
            }}>
                {['overview', 'approvals', 'users', 'orders', 'logs'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={activeTab === tab ? 'btn-primary' : 'btn-secondary'}
                        style={{ textTransform: 'capitalize' }}
                    >
                        {tab}
                        {tab === 'approvals' && pendingUsers.length > 0 && (
                            <span style={{
                                marginLeft: '0.5rem',
                                background: '#ef4444',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '12px',
                                fontSize: '0.8rem'
                            }}>
                                {pendingUsers.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && stats && (
                <div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '1.5rem',
                        marginBottom: '2rem'
                    }}>
                        <div className="glass-panel" style={{ padding: '1.5rem' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                                {stats.totalUsers}
                            </div>
                            <div style={{ color: 'var(--text-muted)' }}>Total Users</div>
                        </div>

                        <div className="glass-panel" style={{ padding: '1.5rem' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
                                {stats.pendingApprovals}
                            </div>
                            <div style={{ color: 'var(--text-muted)' }}>Pending Approvals</div>
                        </div>

                        <div className="glass-panel" style={{ padding: '1.5rem' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                                {stats.totalOrders}
                            </div>
                            <div style={{ color: 'var(--text-muted)' }}>Total Orders</div>
                        </div>

                        <div className="glass-panel" style={{ padding: '1.5rem' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔄</div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#22c55e' }}>
                                {stats.activeOrders}
                            </div>
                            <div style={{ color: 'var(--text-muted)' }}>Active Orders</div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <h2 style={{ marginBottom: '1rem' }}>Recent Activity</h2>
                        {stats.recentActivity && stats.recentActivity.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {stats.recentActivity.map(log => (
                                    <div key={log.id} style={{
                                        padding: '0.75rem',
                                        background: 'rgba(255,255,255,0.03)',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <span style={{ fontWeight: '500' }}>
                                                {log.User?.username || 'System'}
                                            </span>
                                            {' '}
                                            <span style={{ color: 'var(--text-muted)' }}>
                                                {log.action.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            {new Date(log.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-muted)' }}>No recent activity</p>
                        )}
                    </div>
                </div>
            )}

            {/* Pending Approvals Tab */}
            {activeTab === 'approvals' && (
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h2 style={{ marginBottom: '1rem' }}>Pending User Approvals</h2>
                    {pendingUsers.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                            No pending approvals 🎉
                        </p>
                    ) : (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {pendingUsers.map(user => (
                                <div key={user.id} className="glass-panel" style={{
                                    padding: '1rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                                            {user.username}
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '12px',
                                                fontSize: '0.85rem',
                                                background: getRoleBadgeColor(user.role),
                                                color: 'white'
                                            }}>
                                                {user.role}
                                            </span>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                Registered: {new Date(user.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => approveUser(user.id)}
                                        className="btn-primary"
                                        style={{ padding: '0.5rem 1.5rem' }}
                                    >
                                        ✓ Approve
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h2 style={{ marginBottom: '1rem' }}>All Users</h2>
                    {loading ? (
                        <p>Loading...</p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Username</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Role</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Joined</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '0.75rem' }}>{user.username}</td>
                                            <td style={{ padding: '0.75rem' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '12px',
                                                    fontSize: '0.85rem',
                                                    background: getRoleBadgeColor(user.role),
                                                    color: 'white'
                                                }}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>
                                                {user.isApproved ? (
                                                    <span style={{ color: '#22c55e' }}>✓ Approved</span>
                                                ) : (
                                                    <span style={{ color: '#f59e0b' }}>⏳ Pending</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '0.75rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>
                                                {user.role !== 'admin' && (
                                                    <button
                                                        onClick={() => deleteUser(user.id, user.username)}
                                                        style={{
                                                            background: '#ef4444',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '0.4rem 0.8rem',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.85rem'
                                                        }}
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h2 style={{ marginBottom: '1rem' }}>All Orders</h2>
                    {loading ? (
                        <p>Loading...</p>
                    ) : (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {orders.map(order => {
                                const isExpanded = expandedOrderId === order.id;
                                return (
                                    <div key={order.id} className="glass-panel" style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', gap: '1rem', alignItems: 'center' }}>
                                            <div>
                                                <span style={{ fontWeight: 'bold' }}>Order #{order.id}</span>
                                                {' - '}
                                                <span style={{ color: 'var(--text-muted)' }}>
                                                    by {order.Maker?.username}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '12px',
                                                    fontSize: '0.85rem',
                                                    background: getStatusColor(order.status),
                                                    color: 'white'
                                                }}>
                                                    {order.status}
                                                </span>
                                                <button
                                                    className="btn-secondary"
                                                    onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                                                >
                                                    {isExpanded ? 'Hide Details' : 'View Details'}
                                                </button>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                            {order.Items?.length || 0} items • Created {new Date(order.createdAt).toLocaleDateString()}
                                        </div>
                                        {order.AssignedTakers && order.AssignedTakers.length > 0 && (
                                            <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                                                Assigned to: {order.AssignedTakers.map(t => t.username).join(', ')}
                                            </div>
                                        )}

                                        {isExpanded && (
                                            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--glass-border)' }}>
                                                <div style={{ marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                                                    {order.description || 'No description provided.'}
                                                </div>
                                                <div style={{ display: 'grid', gap: '0.5rem' }}>
                                                    <div>
                                                        <strong>Items:</strong>
                                                        <ul style={{ margin: '0.5rem 0 0 1rem', padding: 0 }}>
                                                            {(order.Items || []).map(item => (
                                                                <li key={`${order.id}-${item.name}`} style={{ color: 'var(--text-muted)' }}>
                                                                    {item.name} - Qty: {item.quantity}
                                                                </li>
                                                            ))}
                                                            {(order.Items || []).length === 0 && (
                                                                <li style={{ color: 'var(--text-muted)' }}>No items listed</li>
                                                            )}
                                                        </ul>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                                        <span>Created: {new Date(order.createdAt).toLocaleString()}</span>
                                                        <span>Updated: {new Date(order.updatedAt).toLocaleString()}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                        <button className="btn-danger" onClick={() => deleteOrder(order.id)}>
                                                            Delete Order
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Logs Tab */}
            {activeTab === 'logs' && (
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h2 style={{ marginBottom: '1rem' }}>Activity Logs</h2>
                    {loading ? (
                        <p>Loading...</p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Time</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>User</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Action</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map(log => (
                                        <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>
                                                {new Date(log.createdAt).toLocaleString()}
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>
                                                {log.User?.username || 'System'}
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>
                                                {log.action.replace(/_/g, ' ')}
                                            </td>
                                            <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>
                                                {log.details ? JSON.stringify(log.details).substring(0, 50) : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
