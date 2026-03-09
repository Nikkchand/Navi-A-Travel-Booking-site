'use strict';

/**
 * navbar toggle
 */

const navToggleBtn = document.querySelector("[data-nav-toggle-btn]");
const header = document.querySelector("[data-header]");

navToggleBtn.addEventListener("click", function () {
  this.classList.toggle("active");
  header.classList.toggle("active");
});



/**
 * show go top btn when scroll window to 500px
 */

const goTopBtn = document.querySelector("[data-go-top]");

window.addEventListener("scroll", function () {
  window.scrollY >= 500 ? goTopBtn.classList.add("active")
    : goTopBtn.classList.remove("active");
});

// This function should be called when the user clicks the 'Pay' button
async function handlePayment(amount, tourName) {
  
  // 1. Create the Order on Your Server
  const response = await fetch('/api/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: amount,
      tourName: tourName
    }),
  });

  if (!response.ok) {
    alert("Failed to create order. Please try again.");
    return;
  }

  const order = await response.json();

  // 2. Razorpay Checkout Options
  const options = {
    key: 'rzp_test_RKBcDaln3Jv3dm', // Your Key ID
    amount: order.amount,
    currency: 'INR',
    name: 'Navi Travels',
    description: `Booking for ${tourName}`,
    order_id: order.id,
    
    // 3. This handler function is called after payment
    handler: async function (response) {
      const verificationResponse = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
        }),
      });

      const result = await verificationResponse.json();
      if (result.status === 'success') {
          alert('Payment Successful! Your booking is confirmed.');
          // You can redirect to a success page here
          // window.location.href = '/success.html';
      } else {
          alert('Payment verification failed. Please contact support.');
      }
    },
    prefill: {
      name: 'Rahul Chand', // Example
      email: 'rahulchandrc188@gmail.com.com',
      contact: '7209333682'
    },
    theme: {
      color: '#0084ff'
    }
  };

  const rzp = new Razorpay(options);
  rzp.open();
}