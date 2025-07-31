import axios from "axios";

export const verifyPaystackPayment = async (req, res) => {
  const { paymentRef } = req.body;

  if (!paymentRef) {
    return res.status(400).json({ error: "Payment reference is required" });
  }

  try {
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${paymentRef}`,
      {
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
        },
      }
    );

    const data = response.data;

    if (data.status && data.data.status === "success") {
      // ✅ Payment verified successfully
      return res.status(200).json({
        message: "Payment verified",
        payment: data.data,
      });
    } else {
      return res.status(400).json({ error: "Payment verification failed" });
    }
  } catch (error) {
    console.error(
      "Error verifying Paystack payment:",
      error.response?.data || error.message
    );
    return res.status(500).json({ error: "Server error verifying payment" });
  }
};
