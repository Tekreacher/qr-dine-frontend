import { Link } from 'react-router-dom';
import { QrCode } from 'lucide-react';

const LAST_UPDATED = 'August 2026';

export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link to="/" className="flex items-center">
              <QrCode className="h-7 w-7 text-blue-600" />
              <span className="ml-2 text-lg font-bold text-gray-900">QR Dine</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: {LAST_UPDATED}</p>

        <div className="prose prose-gray max-w-none space-y-8">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Who this applies to</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms govern two related relationships: (a) between QR Dine and a <strong>Restaurant</strong> that
              registers an account to take orders through our platform, and (b) between QR Dine and a
              <strong> Customer</strong> (a diner) who places an order through a Restaurant's QR-code menu.
              By registering a Restaurant account, or by placing an order as a Customer, you agree to these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">2. What QR Dine is</h2>
            <p className="text-gray-700 leading-relaxed">
              QR Dine is a QR-code ordering platform that lets a Restaurant publish a digital menu, accept
              dine-in orders, and receive payments. QR Dine is not a party to the sale of food — that transaction
              is between the Customer and the Restaurant. QR Dine provides the ordering, payment-routing, and
              order-management technology that connects them.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Restaurant accounts</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-1.5">
              <li>New Restaurant accounts require admin approval before they can log in and start taking orders.</li>
              <li>You're responsible for the accuracy of your menu, prices, and restaurant details as shown to Customers.</li>
              <li>You're responsible for keeping your login credentials and your Razorpay payment credentials confidential.</li>
              <li>Access is tied to an active subscription. If your subscription lapses, your dashboard and menu ordering will be paused until it's renewed.</li>
              <li>We may suspend or disable an account that we reasonably believe is being used fraudulently, abusively, or in violation of these Terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Payments</h2>
            <p className="text-gray-700 leading-relaxed">
              Payments for food orders are processed directly through each Restaurant's own Razorpay account —
              QR Dine does not hold, control, or take a cut of Customer payments for orders, and does not store
              card, UPI, or bank details; those are handled entirely by Razorpay. Disputes about a specific
              order's charge, refund, or food quality are between the Customer and the Restaurant. QR Dine's own
              subscription fee (charged to the Restaurant for use of the platform) is separate from Customer
              order payments.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">5. Customer orders</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-1.5">
              <li>Placing an order means you're agreeing to purchase the listed items from that Restaurant at the listed price.</li>
              <li>Order accuracy, preparation, and fulfillment are the Restaurant's responsibility, not QR Dine's.</li>
              <li>We share your name, phone number, table number, and order details with the Restaurant so they can prepare and serve your order — that's the whole point of placing it.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">6. Acceptable use</h2>
            <p className="text-gray-700 leading-relaxed">
              Don't use QR Dine to submit fake orders, attempt to access another Restaurant's account or data,
              interfere with the platform's normal operation, or use it for anything unlawful.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">7. Limitation of liability</h2>
            <p className="text-gray-700 leading-relaxed">
              QR Dine is provided "as is." To the fullest extent permitted by law, QR Dine is not liable for
              food quality, order delays, or disputes arising from the underlying transaction between a Customer
              and a Restaurant, nor for losses caused by outages, bugs, or third-party services (Razorpay,
              Cloudinary, SMS/email providers) that QR Dine depends on.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">8. Changes to these Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update these Terms from time to time. Continued use of QR Dine after an update means you
              accept the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">9. Contact</h2>
            <p className="text-gray-700 leading-relaxed">
              Questions about these Terms can be sent to <strong>[your contact email]</strong>.
            </p>
          </section>

          <p className="text-gray-700 leading-relaxed">
            See also our <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
          </p>

        </div>
      </div>
    </div>
  );
}
