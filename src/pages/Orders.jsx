import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Orders() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
      fetch(`${import.meta.env.VITE_BACKEND_URL}/api/orders/${orderId}/status`)
      .then(res => {
        if (!res.ok) throw new Error("Order not found");
        return res.json();
      })
      .then(data => setOrder(data))
      .catch(err => setError(err.message));
  }, [orderId]);

  if (error) return <h2>{error}</h2>;
  if (!order) return <h2>Loading order...</h2>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Order #{order._id}</h1>
      <p>Status: {order.status}</p>
      <p>Total: ₹{order.totalAmount}</p>

      <h3>Items</h3>
      <ul>
        {order.items.map((item, i) => (
          <li key={i}>
            {item.name} × {item.quantity}
          </li>
        ))}
      </ul>
    </div>
  );
}
