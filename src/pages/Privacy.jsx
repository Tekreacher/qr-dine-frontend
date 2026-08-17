import { Link } from 'react-router-dom';
import { QrCode } from 'lucide-react';

const LAST_UPDATED = 'August 2026';

export default function Privacy() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: {LAST_UPDATED}</p>

        <div className="prose prose-gray max-w-none space-y-8">

          <section>
            <p className="text-gray-700 leading-relaxed">
              This Policy explains what personal data QR Dine collects, why, and how it's handled — both for
              <strong> Restaurants</strong> that register an account with us, and for <strong>Customers</strong> who
              place an order through a Restaurant's QR menu. For a Customer's order, the Restaurant is the one
              actually serving you and deciding what to do with your order details; QR Dine is the platform that
              handles the data on the Restaurant's behalf.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">1. What we collect</h2>
            <p className="text-gray-700 font-medium mt-3 mb-1">From Restaurants:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1.5">
              <li>Account details: restaurant name, owner name, email, phone, address, password (stored hashed, never in plain text).</li>
              <li>Menu content: categories, items, prices, images you upload.</li>
              <li>Payment configuration: your own Razorpay key ID and secret, which you enter so payments route to your account — this is stored encrypted and locked behind a separate vault password only you know.</li>
            </ul>
            <p className="text-gray-700 font-medium mt-4 mb-1">From Customers:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1.5">
              <li>Name and phone number, entered when you place an order — used to identify your order to the restaurant and to look up your order history on return visits.</li>
              <li>Order details: items, quantities, table number, order status, timestamps.</li>
              <li>We do <strong>not</strong> collect or store your card, UPI, or bank details — those go directly to Razorpay, the Restaurant's payment processor.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">2. How we use it</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-1.5">
              <li>To operate the ordering flow: showing your menu, taking orders, tracking status, processing payment confirmation.</li>
              <li>To let a Restaurant see its own orders, analytics, and customer history — never another Restaurant's.</li>
              <li>To send order-status updates or password-reset codes by SMS/email.</li>
              <li>To detect abuse (e.g. rate-limiting repeated lookups) and keep the platform secure.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              We don't sell personal data, and we don't use Customer order data for advertising.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Who we share it with</h2>
            <p className="text-gray-700 leading-relaxed mb-2">
              We use the following third-party services to run QR Dine, each of which processes a limited slice
              of the data needed to do its job:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1.5">
              <li><strong>Razorpay</strong> — payment processing (Customer payments go directly to the Restaurant's own Razorpay account).</li>
              <li><strong>Cloudinary</strong> — hosting for menu/restaurant images.</li>
              <li><strong>MongoDB Atlas</strong> — our database, where account, menu, and order data is stored.</li>
              <li><strong>Render / Vercel</strong> — hosting for our backend and website.</li>
              <li><strong>SMS and email providers</strong> — used to deliver order-status texts and password-reset emails.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              A Restaurant sees the order and profile data of its own Customers — that's inherent to running the
              order flow. Restaurants never see another Restaurant's data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Cookies and local storage</h2>
            <p className="text-gray-700 leading-relaxed">
              We don't use tracking or advertising cookies. We use your browser's built-in session storage to
              keep you logged in to a Restaurant dashboard or a Customer ordering session for the lifetime of
              that browser tab — this data stays on your device and isn't shared with any third party.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">5. How long we keep data</h2>
            <p className="text-gray-700 leading-relaxed">
              Order records are kept for the Restaurant's own accounting and record-keeping needs. Customer
              profile data (name, phone) is kept so your order history carries over on return visits, until you
              ask us to delete it (see below) or the associated Restaurant account is closed.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">6. Your rights</h2>
            <p className="text-gray-700 leading-relaxed mb-2">
              You can ask to see, correct, or delete the personal data we hold about you.
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1.5">
              <li><strong>Customers:</strong> open your profile menu on any restaurant's ordering page and choose <em>Delete My Data</em> — this removes your saved profile and strips your name/phone from your past orders at that restaurant immediately. Order records themselves are kept (with your identifying details removed) for the restaurant's accounting, as most privacy laws, including India's Digital Personal Data Protection Act, 2023, allow.</li>
              <li><strong>Restaurants:</strong> to close your account and request deletion of your restaurant data, contact us at <strong>[your contact email]</strong>.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">7. Security</h2>
            <p className="text-gray-700 leading-relaxed">
              Passwords are stored hashed, not in plain text. Payment credentials are stored encrypted behind a
              separate vault password. All traffic to QR Dine is encrypted in transit (HTTPS). No system is
              perfectly secure, and we can't guarantee absolute security, but we take reasonable, industry-standard
              measures to protect your data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">8. Children</h2>
            <p className="text-gray-700 leading-relaxed">
              QR Dine isn't directed at children, and Restaurant accounts require an adult to register. Customer
              ordering only collects a name and phone number, generally provided by the adult placing the order.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">9. Changes to this Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Policy from time to time; the "Last updated" date at the top will reflect the
              latest revision.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">10. Contact</h2>
            <p className="text-gray-700 leading-relaxed">
              Questions about this Policy, or a data request, can be sent to <strong>[your contact email]</strong>.
            </p>
          </section>

          <p className="text-gray-700 leading-relaxed">
            See also our <Link to="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>.
          </p>

        </div>
      </div>
    </div>
  );
}
