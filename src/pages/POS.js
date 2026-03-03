import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiSearch, FiTrash2, FiMinus, FiPlus, FiShoppingCart, FiPrinter, FiDownload } from 'react-icons/fi';
import { jsPDF } from 'jspdf';
import api, { getImageUrl } from '../services/api';
import Modal from '../components/Modal';

// Exchange rate: 1 USD = 4100 KHR
const EXCHANGE_RATE = 4100;

const POS = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('USD'); // USD or KHR

  // Currency helper functions
  const formatCurrency = (amount, curr = currency) => {
    if (curr === 'KHR') {
      return `${Math.round(amount * EXCHANGE_RATE).toLocaleString()}៛`;
    }
    return `$${amount.toFixed(2)}`;
  };

  const convertToKHR = (usdAmount) => Math.round(usdAmount * EXCHANGE_RATE);
  // eslint-disable-next-line no-unused-vars
  const convertToUSD = (khrAmount) => khrAmount / EXCHANGE_RATE;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes, customersRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories'),
        api.get('/customers')
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
      setCustomers(customersRes.data);
    } catch (error) {
      toast.error('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category?._id === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch && product.isActive && product.quantity > 0;
  });

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.product === product._id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.quantity) {
        toast.warning('Not enough stock');
        return;
      }
      setCart(cart.map(item =>
        item.product === product._id
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      setCart([...cart, {
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: 1,
        subtotal: product.price,
        maxStock: product.quantity
      }]);
    }
  };

  const updateQuantity = (productId, change) => {
    setCart(cart.map(item => {
      if (item.product === productId) {
        const newQuantity = item.quantity + change;
        if (newQuantity < 1) return item;
        if (newQuantity > item.maxStock) {
          toast.warning('Not enough stock');
          return item;
        }
        return { ...item, quantity: newQuantity, subtotal: newQuantity * item.price };
      }
      return item;
    }));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setSelectedCustomer('');
  };

  const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const tax = 0; // No tax
  const total = subtotal - discount;
  
  // Calculate change based on currency
  const totalInCurrency = currency === 'KHR' ? convertToKHR(total) : total;
  const amountReceivedNum = parseFloat(amountReceived) || 0;
  const change = amountReceivedNum - totalInCurrency;

  // Generate PDF Receipt
  const generateReceiptPDF = (orderData, action = 'download') => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 200] // Receipt paper size
    });

    const pageWidth = 80;
    let y = 10;

    // Header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Dyna POS', pageWidth / 2, y, { align: 'center' });
    y += 6;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Receipt', pageWidth / 2, y, { align: 'center' });
    y += 5;

    // Date and Order Info
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 5, y);
    y += 4;
    doc.text(`Time: ${new Date().toLocaleTimeString()}`, 5, y);
    y += 4;
    doc.text(`Order #: ${orderData.orderNumber || 'N/A'}`, 5, y);
    y += 4;
    doc.text(`Payment: ${orderData.paymentMethod.toUpperCase()}`, 5, y);
    y += 6;

    // Line separator
    doc.setLineWidth(0.1);
    doc.line(5, y, pageWidth - 5, y);
    y += 4;

    // Items Header
    doc.setFont('helvetica', 'bold');
    doc.text('Item', 5, y);
    doc.text('Qty', 45, y);
    doc.text('Price', 55, y);
    doc.text('Total', pageWidth - 5, y, { align: 'right' });
    y += 4;

    doc.line(5, y, pageWidth - 5, y);
    y += 4;

    // Items
    doc.setFont('helvetica', 'normal');
    orderData.items.forEach(item => {
      const name = item.name.length > 18 ? item.name.substring(0, 18) + '...' : item.name;
      doc.text(name, 5, y);
      doc.text(String(item.quantity), 47, y);
      doc.text(`$${item.price.toFixed(2)}`, 55, y);
      doc.text(`$${item.subtotal.toFixed(2)}`, pageWidth - 5, y, { align: 'right' });
      y += 5;
    });
    y += 2;

    // Line separator
    doc.line(5, y, pageWidth - 5, y);
    y += 5;

    // Totals
    doc.text('Subtotal:', 5, y);
    doc.text(`$${orderData.subtotal.toFixed(2)}`, pageWidth - 5, y, { align: 'right' });
    y += 4;

    if (orderData.discount > 0) {
      doc.text('Discount:', 5, y);
      doc.text(`-$${orderData.discount.toFixed(2)}`, pageWidth - 5, y, { align: 'right' });
      y += 4;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('TOTAL:', 5, y);
    doc.text(`$${orderData.total.toFixed(2)}`, pageWidth - 5, y, { align: 'right' });
    y += 6;

    if (orderData.paymentMethod === 'cash') {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Amount Received:', 5, y);
      doc.text(`$${orderData.amountReceived.toFixed(2)}`, pageWidth - 5, y, { align: 'right' });
      y += 4;
      doc.text('Change:', 5, y);
      doc.text(`$${orderData.change.toFixed(2)}`, pageWidth - 5, y, { align: 'right' });
      y += 6;
    }

    // Footer
    doc.line(5, y, pageWidth - 5, y);
    y += 5;
    doc.setFontSize(8);
    doc.text('Thank you for your purchase!', pageWidth / 2, y, { align: 'center' });
    y += 4;
    doc.text('Please come again', pageWidth / 2, y, { align: 'center' });

    if (action === 'download') {
      doc.save(`receipt_${Date.now()}.pdf`);
    } else if (action === 'print') {
      doc.autoPrint();
      window.open(doc.output('bloburl'), '_blank');
    }
  };

  const handlePayment = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    if (paymentMethod === 'cash' && parseFloat(amountReceived) < total) {
      toast.error('Insufficient amount received');
      return;
    }

    try {
      const orderData = {
        items: cart.map(item => ({
          product: item.product,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.subtotal
        })),
        subtotal,
        tax,
        discount,
        total,
        paymentMethod,
        amountReceived: parseFloat(amountReceived) || total,
        change: change > 0 ? change : 0,
        customer: selectedCustomer || undefined
      };

      const response = await api.post('/orders', orderData);
      
      // Store completed order data for receipt
      setCompletedOrder({
        ...orderData,
        orderNumber: response.data._id?.slice(-8).toUpperCase() || 'N/A'
      });
      
      toast.success('Order completed successfully!');
      setShowPaymentModal(false);
      setShowSuccessModal(true);
      clearCart();
      setAmountReceived('');
      fetchData(); // Refresh products to update stock
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error processing order');
    }
  };

  if (loading) {
    return <div className="spinner"></div>;
  }

  return (
    <div className="pos-container">
      <div className="products-section">
        <div className="search-box">
          <FiSearch style={{ position: 'absolute', left: '10px', top: '12px', color: '#999' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '35px' }}
            placeholder="Search products by name, SKU, or barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="categories-filter">
          <button
            className={`category-pill ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            All
          </button>
          {categories.filter(c => c.isActive).map(category => (
            <button
              key={category._id}
              className={`category-pill ${selectedCategory === category._id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category._id)}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="products-grid">
          {filteredProducts.map(product => (
            <div
              key={product._id}
              className="product-card"
              onClick={() => addToCart(product)}
            >
              <img
                src={getImageUrl(product.image)}
                alt={product.name}
              />
              <h4>{product.name}</h4>
              <p className="price">${product.price.toFixed(2)}</p>
              <small style={{ color: '#666' }}>Stock: {product.quantity}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="cart-section">
        <div className="cart-header">
          <h3><FiShoppingCart /> Cart ({cart.length})</h3>
          {cart.length > 0 && (
            <button className="btn btn-sm btn-danger" onClick={clearCart}>
              Clear
            </button>
          )}
        </div>

        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="empty-state">
              <FiShoppingCart />
              <p>Cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product} className="cart-item">
                <div className="item-info">
                  <h4>{item.name}</h4>
                  <p>${item.price.toFixed(2)} x {item.quantity} = ${item.subtotal.toFixed(2)}</p>
                </div>
                <div className="item-quantity">
                  <button onClick={() => updateQuantity(item.product, -1)}>
                    <FiMinus />
                  </button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product, 1)}>
                    <FiPlus />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.product)}
                    style={{ color: '#ef4444', border: 'none' }}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-footer">
          <div className="form-group">
            <select
              className="form-control"
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
            >
              <option value="">Walk-in Customer</option>
              {customers.map(customer => (
                <option key={customer._id} value={customer._id}>
                  {customer.name} - {customer.phone}
                </option>
              ))}
            </select>
          </div>

          <div className="cart-totals">
            {/* Currency Toggle */}
            <div className="row" style={{ marginBottom: '10px' }}>
              <span>Currency:</span>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button
                  className={`btn btn-sm ${currency === 'USD' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setCurrency('USD')}
                  style={{ padding: '4px 12px', fontSize: '0.85rem' }}
                >
                  USD $
                </button>
                <button
                  className={`btn btn-sm ${currency === 'KHR' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setCurrency('KHR')}
                  style={{ padding: '4px 12px', fontSize: '0.85rem' }}
                >
                  KHR ៛
                </button>
              </div>
            </div>
            <div className="row">
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="row">
              <span>Discount:</span>
              <input
                type="number"
                style={{ width: '80px', textAlign: 'right' }}
                className="form-control"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                min="0"
              />
            </div>
            <div className="row total">
              <span>Total:</span>
              <span>{formatCurrency(total)}</span>
            </div>
            {currency === 'KHR' && (
              <div className="row" style={{ fontSize: '0.85rem', color: '#666' }}>
                <span>≈ USD:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            )}
            {currency === 'USD' && (
              <div className="row" style={{ fontSize: '0.85rem', color: '#666' }}>
                <span>≈ KHR:</span>
                <span>{convertToKHR(total).toLocaleString()}៛</span>
              </div>
            )}
          </div>

          <button
            className="btn btn-success"
            style={{ width: '100%', padding: '15px' }}
            onClick={() => setShowPaymentModal(true)}
            disabled={cart.length === 0}
          >
            Proceed to Payment
          </button>
        </div>
      </div>

      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Payment"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>
              Cancel
            </button>
            <button className="btn btn-success" onClick={handlePayment}>
              Complete Payment
            </button>
          </>
        }
      >
        <div className="form-group">
          <label>Payment Method</label>
          <select
            className="form-control"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="mobile">Mobile Payment</option>
          </select>
        </div>

        <div className="form-group">
          <label>Total Amount ({currency})</label>
          <input
            type="text"
            className="form-control"
            value={formatCurrency(total)}
            readOnly
            style={{ fontWeight: 'bold', fontSize: '1.1rem' }}
          />
          {currency === 'KHR' && (
            <small style={{ color: '#666' }}>≈ ${total.toFixed(2)}</small>
          )}
          {currency === 'USD' && (
            <small style={{ color: '#666' }}>≈ {convertToKHR(total).toLocaleString()}៛</small>
          )}
        </div>

        {paymentMethod === 'cash' && (
          <>
            <div className="form-group">
              <label>Amount Received ({currency})</label>
              <input
                type="number"
                className="form-control"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                placeholder={currency === 'KHR' ? `Min: ${convertToKHR(total).toLocaleString()}៛` : `Min: $${total.toFixed(2)}`}
                min={totalInCurrency}
              />
            </div>

            <div className="form-group">
              <label>Change ({currency})</label>
              <input
                type="text"
                className="form-control"
                value={currency === 'KHR' ? `${change > 0 ? Math.round(change).toLocaleString() : '0'}៛` : `$${change > 0 ? change.toFixed(2) : '0.00'}`}
                readOnly
                style={{ fontWeight: 'bold', color: '#10b981', fontSize: '1.1rem' }}
              />
            </div>
          </>
        )}
      </Modal>

      {/* Success Modal with Print/Download Options */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Order Complete!"
        footer={
          <button 
            className="btn btn-primary" 
            onClick={() => setShowSuccessModal(false)}
          >
            Close
          </button>
        }
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ 
            width: '60px', 
            height: '60px', 
            borderRadius: '50%', 
            background: '#10b981', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <span style={{ color: 'white', fontSize: '30px' }}>✓</span>
          </div>
          
          <h3 style={{ marginBottom: '10px' }}>Payment Successful!</h3>
          
          {completedOrder && (
            <>
              <p style={{ color: '#666', marginBottom: '20px' }}>
                Order #{completedOrder.orderNumber}<br />
                Total: ${completedOrder.total.toFixed(2)}
              </p>
              
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button 
                  className="btn btn-primary"
                  onClick={() => generateReceiptPDF(completedOrder, 'print')}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <FiPrinter /> Print Receipt
                </button>
                <button 
                  className="btn btn-success"
                  onClick={() => generateReceiptPDF(completedOrder, 'download')}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <FiDownload /> Download PDF
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default POS;
