// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";

// // Frontend env (safe)
// const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID as string;
// const DEFAULT_CURRENCY = (import.meta.env.VITE_PAYPAL_CURRENCY as string) || "USD";
// const FUNCTIONS_BASE = (import.meta.env.VITE_FUNCTIONS_BASE as string)?.replace(/\/+$/, "") || "";
// const PUBLIC_JWT = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined; // optional if Verify JWT = true

// function removeExistingPayPalScript() {
//   const existing = document.getElementById("paypal-sdk");
//   if (existing) existing.remove();
// }
// function loadPayPalSdk(clientId: string, currency: string): Promise<void> {
//   return new Promise((resolve, reject) => {
//     if ((window as any).paypal) return resolve();
//     removeExistingPayPalScript();
//     const s = document.createElement("script");
//     s.id = "paypal-sdk";
//     s.async = true;
//     s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
//       clientId
//     )}&currency=${encodeURIComponent(currency)}&components=buttons&intent=capture`;
//     s.onload = () => ((window as any).paypal ? resolve() : reject(new Error("window.paypal missing")));
//     s.onerror = () => reject(new Error("Failed to load PayPal SDK"));
//     document.body.appendChild(s);
//   });
// }

// // Build headers (works for both public and protected functions)
// function headers() {
//   const base: Record<string, string> = { "Content-Type": "application/json" };
//   if (PUBLIC_JWT) {
//     base.Authorization = `Bearer ${PUBLIC_JWT}`;
//     base.apikey = PUBLIC_JWT;
//   }
//   return base;
// }

// const PaymentPage: React.FC = () => {
//   const navigate = useNavigate();
//   const { state } = useLocation() as {
//     state?: { email?: string; fullName?: string; amount?: string; currency?: string };
//   };

//   const email = state?.email || "";
//   const amount = state?.amount || "14.99";
//   const currency = state?.currency || DEFAULT_CURRENCY;

//   const paypalButtonsRef = useRef<HTMLDivElement>(null);
//   const [sdkReady, setSdkReady] = useState(false);
//   const [creating, setCreating] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   // Sanity checks for base URL
//   const baseOK = useMemo(() => Boolean(FUNCTIONS_BASE), []);

//   // Load SDK
//   useEffect(() => {
//     (async () => {
//       try {
//         if (!PAYPAL_CLIENT_ID) throw new Error("VITE_PAYPAL_CLIENT_ID not set.");
//         if (!email) throw new Error("Missing email (navigate from Signup with state.email).");
//         await loadPayPalSdk(PAYPAL_CLIENT_ID, currency);
//         setSdkReady(true);
//       } catch (e: any) {
//         console.error(e);
//         setError(e.message || "Failed to initialize PayPal.");
//       }
//     })();
//   }, [email, currency]);

//   // Render PayPal Buttons
//   useEffect(() => {
//     if (!sdkReady || !paypalButtonsRef.current || !baseOK) return;

//     const win: any = window;
//     const buttons = win.paypal.Buttons({
//       createOrder: async () => {
//         try {
//           setCreating(true);
//           const res = await fetch(`${FUNCTIONS_BASE}/create-paypal-order`, {
//             method: "POST",
//             headers: headers(),
//             body: JSON.stringify({ amount, currency, lead_email: email }),
//           });
//           const data = await res.json();
//           setCreating(false);
//           if (!res.ok || !data?.id) {
//             console.error("create-paypal-order failed:", res.status, data);
//             throw new Error(data?.error || `create-paypal-order HTTP ${res.status}`);
//           }
//           return data.id; // PayPal expects order ID string
//         } catch (e: any) {
//           setCreating(false);
//           setError(`Create order failed: ${e.message}`);
//           throw e;
//         }
//       },
//       onApprove: async (data: any) => {
//         try {
//           const res = await fetch(`${FUNCTIONS_BASE}/capture-paypal-order`, {
//             method: "POST",
//             headers: headers(),
//             body: JSON.stringify({ order_id: data.orderID, lead_email: email }),
//           });
//           const capture = await res.json();
//           if (!res.ok) {
//             console.error("capture-paypal-order failed:", res.status, capture);
//             throw new Error(capture?.error || `capture-paypal-order HTTP ${res.status}`);
//           }
//           alert("Payment successful!");
//           navigate("/thank-you", { state: { email, orderID: data.orderID, capture } });
//         } catch (e: any) {
//           console.error(e);
//           setError(`Capture failed: ${e.message}`);
//         }
//       },
//       onCancel: () => {
//         navigate("/", { replace: true });
//       },
//       onError: (err: any) => {
//         console.error("PayPal Buttons onError:", err);
//         setError("PayPal JS error (see console).");
//       },
//     });

//     buttons.render(paypalButtonsRef.current);
//     return () => {
//       try { buttons.close(); } catch {}
//     };
//   }, [sdkReady, baseOK, amount, currency, email, navigate]);

//   return (
//     <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
//       <div className="w-full max-w-lg rounded-2xl bg-white shadow p-6">
//         <h2 className="text-2xl font-semibold mb-2">Complete Your Payment</h2>
//         <p className="text-sm text-gray-600 mb-6">
//           Amount: <strong>{currency} {amount}</strong>
//         </p>

//         {!FUNCTIONS_BASE && (
//           <div className="mb-4 rounded bg-red-50 border border-red-200 p-3 text-red-700 text-sm">
//             Missing VITE_FUNCTIONS_BASE. Set it to your Supabase Functions URL.
//           </div>
//         )}

//         {error && (
//           <div className="mb-4 rounded bg-red-50 border border-red-200 p-3 text-red-700 text-sm">
//             {error}
//           </div>
//         )}

//         <div className="mb-4" ref={paypalButtonsRef} />
//         {!sdkReady && <p className="text-sm text-gray-500">Loading PayPal…</p>}
//         {creating && <p className="text-sm text-gray-500">Creating order…</p>}

//         {/* <div className="mt-6 text-xs text-gray-500 border-t pt-3">
//           <div><b>Functions Base:</b> {FUNCTIONS_BASE || "(missing)"} </div>
//           <div><b>Anon header attached:</b> {PUBLIC_JWT ? "yes" : "no (public function)"} </div>
//           <div><b>Email:</b> {email || "(none)"} </div>
//         </div> */}
//       </div>
//     </div>
//   );
// };

// export default PaymentPage;














/// src/pages/PaymentPage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import supabase from "../utils/supabase";

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID as string;
const DEFAULT_CURRENCY = (import.meta.env.VITE_PAYPAL_CURRENCY as string) || "USD";

function removeExistingPayPalScript() {
  const existing = document.getElementById("paypal-sdk");
  if (existing) existing.remove();
}

function loadPayPalSdk(clientId: string, currency: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).paypal) {
      console.log("PayPal SDK already loaded");
      return resolve();
    }
    
    removeExistingPayPalScript();
    const script = document.createElement("script");
    script.id = "paypal-sdk";
    script.async = true;
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
      clientId
    )}&currency=${encodeURIComponent(currency)}&components=buttons&intent=capture`;
    
    script.onload = () => {
      console.log("PayPal SDK loaded successfully");
      if ((window as any).paypal) {
        resolve();
      } else {
        reject(new Error("window.paypal not available after loading"));
      }
    };
    
    script.onerror = (error) => {
      console.error("Failed to load PayPal SDK:", error);
      reject(new Error("Failed to load PayPal SDK"));
    };
    
    document.body.appendChild(script);
  });
}

function fireConfettiVia(instance: ReturnType<typeof confetti.create>) {
  const duration = 1200;
  const end = Date.now() + duration;
  (function frame() {
    instance({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 } });
    instance({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 } });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
  instance({
    particleCount: 120,
    spread: 70,
    startVelocity: 45,
    scalar: 0.9,
    ticks: 200,
    origin: { y: 0.5 },
  });
}

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as {
    state?: {
      leadRef?: string;
      email?: string;
      fullName?: string;
      phone?: string;
      countryCode?: string;
      promoCode?: string | null;
      amount?: string;
      currency?: string;
    };
  };

  const leadRef = state?.leadRef || null;
  const email = state?.email || "";
  const fullName = state?.fullName || "";
  const phone = state?.phone || "";
  const countryCode = state?.countryCode || "";
  const promoCode = state?.promoCode ?? null;
  const amount = state?.amount || "14.99";
  const currency = state?.currency || DEFAULT_CURRENCY;

  const paypalButtonsRef = useRef<HTMLDivElement>(null);
  const cardCanvasRef = useRef<HTMLCanvasElement>(null);
  const confettiInstanceRef = useRef<ReturnType<typeof confetti.create> | null>(null);

  const [sdkReady, setSdkReady] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showRedirectPrompt, setShowRedirectPrompt] = useState(false);
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<string>("");

  // Load SDK
  useEffect(() => {
    (async () => {
      try {
        if (!PAYPAL_CLIENT_ID) {
          throw new Error("PayPal Client ID not configured");
        }
        if (!email) {
          throw new Error("Missing user information. Please complete the signup form first.");
        }
        
        console.log("Loading PayPal SDK...");
        await loadPayPalSdk(PAYPAL_CLIENT_ID, currency);
        setSdkReady(true);
        console.log("PayPal SDK ready");
      } catch (e: any) {
        console.error("PayPal SDK loading error:", e);
        setError(e.message || "Failed to initialize payment system.");
      }
    })();
  }, [email, currency]);

  // Function to create user in Supabase Auth
  const createAuthUser = async (userEmail: string, userFullName: string) => {
    try {
      const defaultPassword = "Created@123";
      const cleanEmail = userEmail.trim().toLowerCase();
      
      console.log("🔐 Creating auth user for:", cleanEmail);
      setAuthStatus("Creating your account...");

      // Try to sign up new user
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: defaultPassword,
        options: {
          data: {
            full_name: userFullName.trim(),
            phone: phone.trim(),
            country_code: countryCode,
            lead_ref: leadRef
          }
        }
      });

      if (error) {
        console.error("❌ Auth error:", error);
        
        // If user already exists, that's fine - we'll proceed
        if (error.message?.includes("already registered") || error.code === 'user_already_exists') {
          console.log("✅ User already exists in auth");
          setAuthStatus("Account already exists - payment completed");
          return { success: true, exists: true };
        }
        
        // For other errors, log but don't block
        console.warn("⚠️ Auth creation failed but continuing:", error.message);
        setAuthStatus("Payment completed - you can login with email later");
        return { success: false, error: error.message, nonBlocking: true };
      }

      if (data.user) {
        console.log("✅ Auth user created successfully:", data.user.id);
        setAuthStatus("Account created successfully!");
        
        // Update payment record with auth user ID
        if (leadRef) {
          try {
            await supabase
              .from("paymentssupertable")
              .update({ 
                auth_user_id: data.user.id,
                updated_at: new Date().toISOString()
              })
              .eq("lead_ref", leadRef);
            console.log("✅ Linked auth user to payment record");
          } catch (updateError) {
            console.error("❌ Failed to update auth_user_id:", updateError);
          }
        }
        
        return { success: true, exists: false, userId: data.user.id };
      }

      // If we get here but no error, still success
      setAuthStatus("Payment completed successfully");
      return { success: true, exists: false };

    } catch (err: any) {
      console.error("❌ Unexpected error in auth creation:", err);
      setAuthStatus("Payment completed - account setup may need manual completion");
      return { success: false, error: err.message, nonBlocking: true };
    }
  };

  // Function to update payment record
  const updatePaymentRecord = async (orderId: string, captureData: any) => {
    try {
      console.log("💳 Updating payment record for lead_ref:", leadRef);
      
      const updateData = {
        payment_status: "completed",
        paypal_status: "captured", 
        paypal_order_id: orderId,
        paypal_capture_data: captureData,
        status: "completed",
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from("paymentssupertable")
        .update(updateData)
        .eq("lead_ref", leadRef)
        .select();

      if (error) {
        console.error("❌ Payment record update error:", error);
        throw error;
      }
      
      console.log("✅ Payment record updated successfully");
      return true;
    } catch (err: any) {
      console.error("❌ Error updating payment record:", err);
      return false;
    }
  };

  // Render PayPal Buttons - COMPLETELY FIXED VERSION
  useEffect(() => {
    if (!sdkReady || !paypalButtonsRef.current || success) return;

    console.log("🔄 Rendering PayPal buttons...");

    const win: any = window;
    
    // FIXED: Use the correct PayPal integration pattern
    const buttons = win.paypal.Buttons({
      style: {
        layout: 'vertical',
        color:  'gold',
        shape:  'rect',
        label:  'paypal'
      },
      
      createOrder: function(data: any, actions: any) {
        console.log("🔄 Creating PayPal order...");
        setCreating(true);
        setError(null);

        // FIXED: Return the promise directly without async/await
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: amount,
              currency_code: currency
            },
            description: "Job Seeker Account Registration",
            custom_id: leadRef || `signup_${email}`
          }],
          application_context: {
            shipping_preference: "NO_SHIPPING",
            user_action: "PAY_NOW"
          }
        }).then(function(orderId: string) {
          console.log("✅ PayPal order created with ID:", orderId);
          setCreating(false);
          return orderId;
        }).catch(function(error: any) {
          console.error("❌ PayPal order creation failed:", error);
          setCreating(false);
          setError(`Order creation failed: ${error.message}`);
          throw error;
        });
      },

      onApprove: function(data: any, actions: any) {
        console.log("✅ PayPal order approved:", data.orderID);
        setAuthStatus("Processing payment...");
        
        // FIXED: Return the capture promise chain
        return actions.order.capture().then(function(captureData: any) {
          console.log("💰 PayPal order captured:", captureData);
          
          // Update payment record
          if (leadRef) {
            setAuthStatus("Updating payment records...");
            return updatePaymentRecord(data.orderID, captureData).then(function() {
              console.log("✅ Payment record updated");
              
              // Create auth user (non-blocking)
              setAuthStatus("Creating your account...");
              return createAuthUser(email, fullName).then(function(authResult) {
                if (authResult.success) {
                  console.log("✅ Auth process completed");
                } else {
                  console.log("⚠️ Auth had issues but payment completed");
                }

                // Show success UI
                setSuccess(true);
                setCompletedOrderId(data.orderID);

                // Fire confetti
                requestAnimationFrame(() => {
                  const canvas = cardCanvasRef.current;
                  if (canvas) {
                    if (!confettiInstanceRef.current) {
                      confettiInstanceRef.current = confetti.create(canvas, { 
                        resize: true, 
                        useWorker: true 
                      });
                    }
                    fireConfettiVia(confettiInstanceRef.current);
                  }
                });

                setTimeout(() => setShowRedirectPrompt(true), 2000);
              });
            });
          } else {
            // If no leadRef, still show success
            setSuccess(true);
            setCompletedOrderId(data.orderID);
            setTimeout(() => setShowRedirectPrompt(true), 2000);
          }
        }).catch(function(error: any) {
          console.error("❌ PayPal capture failed:", error);
          setError(`Payment failed: ${error.message}`);
          setAuthStatus("");
        });
      },

      onCancel: function(data: any) {
        console.log("❌ PayPal payment cancelled");
        navigate("/signup", { replace: true });
      },

      onError: function(err: any) {
        console.error("❌ PayPal Buttons error:", err);
        setError("Payment processing error. Please try again.");
      }
    });

    if (paypalButtonsRef.current) {
      buttons.render(paypalButtonsRef.current).catch((err: any) => {
        console.error("❌ PayPal buttons render error:", err);
        setError("Failed to initialize payment buttons.");
      });
    }

    return () => {
      try {
        buttons.close();
      } catch (err) {
        console.error("Error cleaning up PayPal buttons:", err);
      }
    };
  }, [sdkReady, amount, currency, email, fullName, phone, countryCode, leadRef, navigate, success]);

  // FIXED: Corrected the function to redirect to the external URL
  const goToAccount = () => {
    window.location.href = "https://sponsored-jobs-one.vercel.app/";
  };

  const goBackToSignup = () => {
    navigate("/signup");
  };

  if (!state) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-lg rounded-2xl bg-white shadow p-6 text-center">
          <h2 className="text-2xl font-semibold mb-4">Session Expired</h2>
          <p className="text-gray-600 mb-6">Please complete the signup form first.</p>
          <button
            onClick={goBackToSignup}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Signup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow p-6 relative overflow-hidden">
        <h2 className="text-2xl font-semibold mb-2">Complete Your Payment</h2>
        <p className="text-sm text-gray-600 mb-2">
          Amount: <strong>{currency} {amount}</strong>
        </p>
        <p className="text-xs text-gray-500 mb-6">
          For: {fullName} ({email})
        </p>

        {error && (
          <div className="mb-4 rounded bg-red-50 border border-red-200 p-3 text-red-700 text-sm">
            <div className="flex justify-between items-start">
              <span>{error}</span>
              <button 
                onClick={() => setError(null)}
                className="text-red-800 font-bold ml-2 hover:text-red-900"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {!PAYPAL_CLIENT_ID && (
          <div className="mb-4 rounded bg-yellow-50 border border-yellow-200 p-3 text-yellow-700 text-sm">
            ⚠️ PayPal Client ID not configured.
          </div>
        )}

        {authStatus && !success && (
          <div className="mb-4 rounded bg-blue-50 border border-blue-200 p-3 text-blue-700 text-sm">
            {authStatus}
          </div>
        )}

        {!success && (
          <div className="mb-4">
            <div ref={paypalButtonsRef} />
            {!sdkReady && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Loading payment system...</p>
              </div>
            )}
            {creating && (
              <div className="text-center py-2">
                <p className="text-sm text-gray-500">Creating order...</p>
              </div>
            )}
          </div>
        )}

        {success && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative bg-white rounded-2xl shadow-2xl p-10 w-[90%] max-w-sm text-center overflow-hidden">
              <canvas ref={cardCanvasRef} className="pointer-events-none absolute inset-0 z-[20000]" />
              <div className="absolute -inset-1 rounded-2xl blur-2xl opacity-40 bg-gradient-to-r from-emerald-400 to-indigo-400"></div>

              <div className="relative z-[15001]">
                <svg className="mx-auto" width="120" height="120" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" className="text-emerald-500" strokeWidth="6" opacity="0.25" />
                  <circle
                    cx="60" cy="60" r="54" fill="none" stroke="currentColor"
                    className="text-emerald-500" strokeWidth="6" strokeLinecap="round"
                    strokeDasharray="339.292" strokeDashoffset="339.292">
                    <animate attributeName="stroke-dashoffset" from="339.292" to="0" dur="0.5s" fill="freeze" />
                  </circle>
                  <path
                    d="M38 64 L54 78 L84 46"
                    fill="none" stroke="currentColor" className="text-emerald-600"
                    strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"
                    strokeDasharray="60" strokeDashoffset="60">
                    <animate attributeName="stroke-dashoffset" from="60" to="0" dur="0.5s" begin="0.35s" fill="freeze" />
                  </path>
                </svg>

                <h3 className="mt-4 text-2xl font-semibold text-gray-900">Payment Successful!</h3>
                
                {authStatus && (
                  <p className="mt-2 text-sm text-green-600 bg-green-50 rounded-lg p-2">
                    {authStatus}
                  </p>
                )}
                
                <p className="mt-3 text-sm text-gray-600">
                  Order ID: <code className="text-xs bg-gray-100 px-1 rounded">{completedOrderId}</code>
                </p>

                {showRedirectPrompt && (
                  <div className="mt-4">
                    <button 
                      onClick={goToAccount}
                      className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
                    >
                      Continue to Your Account
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 text-center">
          <button
            onClick={goBackToSignup}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            ← Back to Signup
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;