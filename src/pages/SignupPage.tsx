// src/pages/SignupPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../utils/supabase";

const SignupPage: React.FC = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    countryCode: "",
    phone: "",
    email: "",
    promoCode: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const makeLeadRef = () => {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return "lead_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate form
    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim() || !form.countryCode) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }

    try {
        const { error: leadsError } = await supabase
        .from('naga_leads')
        .insert([
          {
            full_name: form.fullName,
            email: form.email,
            phone: form.phone,
            country_code: form.countryCode,
            promo_code: "Main Site",
          }
        ]);

      if (leadsError) {
                  throw leadsError;
                  return;
      }
      const leadRef = makeLeadRef();
      console.log("🔄 Creating record with lead_ref:", leadRef);

      // Prepare data for insertion
      const insertData = {
        lead_ref: leadRef,
        full_name: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        country_code: form.countryCode,
        promo_code: form.promoCode.trim() || null,
        status: "created",
        payment_status: "pending",
        paypal_status: "pending",
        paypal_intent: "CAPTURE",
        currency: "USD",
        amount: 14.99,
      };

      console.log("📝 Inserting data:", insertData);

      // Insert initial row into paymentssupertable
      const { data, error: insertErr } = await supabase
        .from("paymentssupertable")
        .insert([insertData])
        .select();

      if (insertErr) {
        console.error("❌ Supabase insert error:", insertErr);
        throw new Error(`Failed to create account: ${insertErr.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error("No data returned after insertion");
      }

      console.log("✅ Record created successfully:", data[0]);

      // Navigate to payment with all details + leadRef
      navigate("/payment", {
        state: {
          leadRef,
          email: form.email.trim(),
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          countryCode: form.countryCode,
          promoCode: form.promoCode.trim() || null,
          amount: "14.99",
          currency: "USD",
        },
      });
    } catch (err: any) {
      console.error("❌ Signup error:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto w-full max-w-5xl px-4 pt-6">
        <button
          onClick={() => navigate("/")}
          className="group inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <svg className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M12.293 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L8.414 9H17a1 1 0 110 2H8.414l3.879 3.879a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back to home
        </button>
      </div>

      <div className="mx-auto mt-8 w-full max-w-3xl px-4 pb-12">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.06)]">
          <div className="p-8 sm:p-12">
            <h1 className="text-center text-3xl font-extrabold tracking-tight text-gray-900">
              Create your account
            </h1>
            <p className="mt-3 text-center text-base text-gray-500">
              Join thousands of successful job seekers
            </p>

            <form onSubmit={handleSubmit} className="mx-auto mt-10 max-w-2xl space-y-6">
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                  Full Name *
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                  className="w-full rounded-xl border border-transparent bg-indigo-50/60 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none ring-1 ring-indigo-100 focus:ring-2 focus:ring-indigo-300"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 space-y-2">
                  <label htmlFor="countryCode" className="text-sm font-medium text-gray-700">
                    Country Code *
                  </label>
                  <select
                    id="countryCode"
                    name="countryCode"
                    value={form.countryCode}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-transparent bg-indigo-50/60 px-4 py-3 text-gray-900 outline-none ring-1 ring-indigo-100 focus:ring-2 focus:ring-indigo-300"
                  >
                    <option value="">Select Code</option>
                    <option value="+1">+1 (US)</option>
                    <option value="+44">+44 (UK)</option>
                    <option value="+91">+91 (India)</option>
                  </select>
                </div>
                <div className="col-span-2 space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                    Phone Number *
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    required
                    className="w-full rounded-xl border border-transparent bg-indigo-50/60 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none ring-1 ring-indigo-100 focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email ID *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                  className="w-full rounded-xl border border-transparent bg-indigo-50/60 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none ring-1 ring-indigo-100 focus:ring-2 focus:ring-indigo-300"
                />
              </div>
                        
              <div className="space-y-2">
                <label className="inline-flex items-center space-x-2 text-sm">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    required
                  />
                  <span>I agree to the Terms & Conditions *</span>
                </label>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-4 border border-red-200">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !agreedToTerms}
                className={`w-full rounded-xl px-6 py-3 text-lg font-semibold text-white shadow-lg hover:scale-[1.01] transition-transform focus:ring-4 focus:ring-blue-300 disabled:opacity-70 disabled:cursor-not-allowed ${
                  agreedToTerms
                    ? "bg-gradient-to-r from-blue-800 to-purple-800 hover:from-blue-700 hover:to-purple-700"
                    : "bg-gradient-to-r from-blue-600 to-purple-600"
                }`}
              >
                {loading ? "Redirecting to paypal payment page..." : "Proceed to Payment"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
