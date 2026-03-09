const express = require('express');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const path = require('path');
const app = express();
const PORT = 5500;

// --- Middleware ---
// To parse JSON request bodies
app.use(express.json());
app.use(express.static("assets"));

// --- Homepage Route ---
app.get('/', (req, res) => {
  res.sendFile(path.join(assets, 'index.html'));
});

// --- Database Connection ---
const DB_CONNECTION_STRING = 'mongodb+srv://rahulchandrc188_db_user:Navi_rc%40travel@navi.rutrxt0.mongodb.net/?retryWrites=true&w=majority&appName=Navi';
mongoose.connect(DB_CONNECTION_STRING)
  .then(() => console.log('✅ MongoDB connected successfully!'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// --- Database Schema ---
const bookingSchema = new mongoose.Schema({
  tourName: { type: String, required: true },
  amount: { type: Number, required: true },
  razorpay_order_id: { type: String, required: true },
  razorpay_payment_id: { type: String },
  razorpay_signature: { type: String },
  status: { type: String, default: 'created' } // e.g., created, successful, failed
});

const Booking = mongoose.model('Booking', bookingSchema);

// --- Razorpay Instance ---
const razorpay = new Razorpay({
  key_id: 'rzp_test_RKBcDaln3Jv3dm',
  key_secret: 'VmpAiVsdXDnwS5fa9g34icvy'
});


// --- API Routes ---

// 1. Create Order Route
app.post('/api/create-order', async (req, res) => {
  const { amount, tourName } = req.body;

  const options = {
    amount: amount * 100, // Amount in the smallest currency unit (paise)
    currency: "INR",
    receipt: `receipt_order_${new Date().getTime()}`
  };

  try {
    const order = await razorpay.orders.create(options);
    
    // Save the initial booking details to the database
    const booking = new Booking({
        tourName: tourName,
        amount: amount,
        razorpay_order_id: order.id,
        status: 'created'
    });
    await booking.save();

    res.json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).send("Error creating order");
  }
});

// 2. Verify Payment Route
app.post('/api/verify-payment', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  
  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac('sha256', razorpay.key_secret)
    .update(body.toString())
    .digest('hex');

  const isAuthentic = expectedSignature === razorpay_signature;

  if (isAuthentic) {
    // Payment is authentic, update the booking in the database
    await Booking.findOneAndUpdate(
        { razorpay_order_id: razorpay_order_id },
        {
            razorpay_payment_id: razorpay_payment_id,
            razorpay_signature: razorpay_signature,
            status: 'successful'
        }
    );
    // Redirect to a success page or send a success response
    res.json({ status: 'success', orderId: razorpay_order_id });

  } else {
    // Payment is not authentic
    await Booking.findOneAndUpdate(
        { razorpay_order_id: razorpay_order_id },
        { status: 'failed' }
    );
    res.status(400).json({ status: 'failure' });
  }
});


// --- Start Server ---
app.listen(PORT, () => {
  console.log(`🚀 Server is listening on http://localhost:${PORT}`);
});