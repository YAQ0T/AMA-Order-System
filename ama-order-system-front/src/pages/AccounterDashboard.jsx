import React from 'react';
import { useOrder } from '../context/OrderContext';

const AccounterDashboard = () => {
    const { orders, orderPagination, fetchOrders, updateOrderStatus } = useOrder();

    React.useEffect(() => {
        fetchOrders({ limit: orderPagination.limit, offset: orderPagination.offset });
    }, [fetchOrders, orderPagination.limit, orderPagination.offset]);

    const completedOrders = orders;

    const handleEnterErp = async (orderId) => {
        await updateOrderStatus(orderId, 'entered_erp');
        await fetchOrders({ limit: orderPagination.limit, offset: orderPagination.offset });
    };

    const limit = orderPagination.limit || 20;
    const totalOrders = orderPagination.total || completedOrders.length;
    const totalPages = Math.max(1, Math.ceil(totalOrders / limit));
    const currentPage = Math.min(Math.floor((orderPagination.offset || 0) / limit) + 1, totalPages);

    const handlePageChange = (page) => {
        const newPage = Math.min(Math.max(page, 1), totalPages);
        fetchOrders({ limit, offset: (newPage - 1) * limit });
    };

    const start = totalOrders === 0 ? 0 : (orderPagination.offset || 0) + 1;
    const end = totalOrders === 0 ? 0 : Math.min(totalOrders, (orderPagination.offset || 0) + limit);

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1>Accounter Dashboard</h1>
                <p style={{ color: 'var(--text-muted)' }}>Review completed orders and mark them as entered to ERP.</p>
            </header>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                    Showing {start}-{end} of {totalOrders} orders
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

            <div style={{ display: 'grid', gap: '1.25rem' }}>
                {completedOrders.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-muted)' }}>No completed orders assigned to you yet.</p>
                    </div>
                ) : (
                    completedOrders.map(order => {
                        const statusColor = order.status === 'entered_erp' ? '#8b5cf6' : '#34d399';
                        return (
                            <div key={order.id} className="glass-panel" style={{ padding: '1.5rem', borderLeft: `4px solid ${statusColor}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                            <span style={{ fontFamily: 'monospace', background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                                #{String(order.id).padStart(6, '0')}
                                            </span>
                                            <span style={{ fontWeight: 600 }}>{order.title || 'Untitled Order'}</span>
                                            <span style={{ color: 'var(--text-muted)' }}>{order.city}</span>
                                        </div>
                                        <div style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                            Maker: {order.Maker?.username}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                        <span style={{ color: statusColor, fontWeight: '600' }}>
                                            {order.status === 'entered_erp' ? 'Entered to ERP' : 'Completed'}
                                        </span>
                                        {order.status === 'completed' && (
                                            <button className="btn-primary" onClick={() => handleEnterErp(order.id)}>
                                                Mark Entered to ERP
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {order.Items && order.Items.length > 0 && (
                                    <table className="order-items-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                                                <th style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>Product</th>
                                                <th style={{ padding: '0.5rem', color: 'var(--text-muted)', textAlign: 'right' }}>Qty</th>
                                                <th style={{ padding: '0.5rem', color: 'var(--text-muted)', textAlign: 'right' }}>Price</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {order.Items.map(item => (
                                                <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <td style={{ padding: '0.5rem' }}>{item.name}</td>
                                                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>{item.quantity}</td>
                                                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>{item.price ? `${item.price} ₪` : '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default AccounterDashboard;
