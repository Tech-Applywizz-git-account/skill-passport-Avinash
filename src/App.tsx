import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
// import ProductPage from './pages/ProductPage';
import SignupPage from './pages/SignupPage';   // <-- import your SignupPage
import ComingSoon from './pages/comingSoon';
// import Publications from './pages/Publications';
// import JobReady from './pages/JobReady';
// import H1B from './pages/H1B';
import PaymentPage from "./pages/PaymentPage";


const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        {/* <Route path="/product" element={<ProductPage />} /> */}
        <Route path="/signup" element={<SignupPage />} />   {/* <-- add this */}
        <Route path="/comingSoon" element={<ComingSoon />} />
        <Route path="/payment" element={<PaymentPage />} />
         {/* <Route path="/Publications" element={<Publications />} /> */}
         {/* <Route path="/JobReady" element={<JobReady />} /> */}
         {/* <Route path="/H1B" element={<H1B />} /> */}
      </Routes>
    </Router>
  );
};

export default App;

