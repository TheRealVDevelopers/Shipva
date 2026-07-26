import React from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ArrowRight, Lock, Truck, Route, FileBarChart } from 'lucide-react';
import { STAFF_APP_URL } from '@/lib/staffApp';

/**
 * Staff Login — the doorway from the public website into the Transporter OS.
 *
 * This replaces the old Client Portal page, which showed a username/password
 * form that was never wired to anything. Collecting credentials on a page that
 * can't authenticate is worse than not having the form at all, so this page
 * doesn't ask for them: the real sign-in lives in the CRM, and this simply
 * sends staff there.
 */
const StaffLogin = () => (
  <>
    <Helmet>
      <title>Staff Login | Sarva Express</title>
      <meta name="description" content="Sarva Express staff sign-in — trips, Amazon tours, fleet, vendors and accounts." />
      {/* An internal tool has no business in search results. */}
      <meta name="robots" content="noindex" />
    </Helmet>

    <Navbar />

    <main className="min-h-screen bg-gray-100 py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-xl overflow-hidden rounded-lg bg-white shadow-xl">
          <div className="bg-sarva-blue-dark px-8 py-8 text-center text-white">
            <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
              <Lock className="h-6 w-6" />
            </span>
            <h1 className="text-3xl font-bold">Staff Login</h1>
            <p className="mt-1 text-sm text-white/70">Sarva Express Transport OS</p>
          </div>

          <div className="space-y-6 p-8">
            <p className="text-gray-600">
              The operations system is where the team runs trips, Amazon tours, the vendor
              register and accounts. Sign in with the company email and password your
              administrator gave you.
            </p>

            <a
              href={STAFF_APP_URL}
              className="flex w-full items-center justify-center rounded-md bg-sarva-orange px-4 py-3 font-semibold text-white transition-all hover:bg-opacity-90"
            >
              Open the staff app
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>

            <div className="grid gap-3 border-t border-gray-100 pt-6 sm:grid-cols-3">
              {[
                { icon: <Truck className="h-5 w-5" />, label: 'Trips & fleet' },
                { icon: <Route className="h-5 w-5" />, label: 'Amazon tours' },
                { icon: <FileBarChart className="h-5 w-5" />, label: 'Accounts & MIS' },
              ].map((f) => (
                <div key={f.label} className="flex flex-col items-center gap-1.5 text-center text-gray-600">
                  <span className="text-sarva-blue">{f.icon}</span>
                  <span className="text-xs font-semibold">{f.label}</span>
                </div>
              ))}
            </div>

            <p className="rounded-md bg-gray-50 px-4 py-3 text-xs text-gray-500">
              No account? Your owner or manager creates staff logins from Team &amp; Roles inside
              the app. Customers looking to track a shipment can use the tracking box on the
              home page or <a href="/contact" className="font-semibold text-sarva-blue hover:underline">contact us</a>.
            </p>
          </div>
        </div>
      </div>
    </main>

    <Footer />
  </>
);

export default StaffLogin;
