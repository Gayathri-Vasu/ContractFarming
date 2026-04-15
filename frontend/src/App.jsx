import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import AuthProvider from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import { useAuth } from './context/AuthContext'

// Pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import FarmerDashboard from './pages/FarmerDashboard'
import BuyerDashboard from './pages/BuyerDashboard'
import AdminDashboard from './pages/AdminDashboard'
import Marketplace from './pages/Marketplace'
import Contracts from './pages/Contracts'
import ContractDetails from './pages/ContractDetails'
import Payments from './pages/Payments'
import Profile from './pages/Profile'
import CropForm from './pages/CropForm'
import ContractForm from './pages/ContractForm'
import OtherPartyContracts from './pages/OtherPartyContracts'
import FarmerCircle from './pages/FarmerCircle'
import BuyerCircle from './pages/BuyerCircle'
import ContractMessages from './pages/ContractMessages'
import DigiContract from './pages/DigiContract'
import DigiContractView from './pages/DigiContractView'
import DigiContractList from './pages/DigiContractList'

const AppRoutes = () => {
  const { loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/farmer/dashboard" element={<PrivateRoute><FarmerDashboard /></PrivateRoute>} />
      <Route path="/farmer/crops/new" element={<PrivateRoute><CropForm /></PrivateRoute>} />
      <Route path="/farmer/crops/edit/:id" element={<PrivateRoute><CropForm /></PrivateRoute>} />
      
      <Route path="/buyer/dashboard" element={<PrivateRoute><BuyerDashboard /></PrivateRoute>} />
      
      <Route path="/admin/dashboard" element={<PrivateRoute requiredRole="admin"><AdminDashboard /></PrivateRoute>} />
      
      <Route path="/marketplace" element={<Marketplace />} />
      <Route path="/farmer-circle" element={<FarmerCircle />} />
      <Route path="/buyer-circle" element={<BuyerCircle />} />
      <Route path="/contracts/new" element={<PrivateRoute><ContractForm /></PrivateRoute>} />
      <Route path="/contracts/farmers" element={<PrivateRoute><OtherPartyContracts /></PrivateRoute>} />
      <Route path="/contracts/buyers" element={<PrivateRoute><OtherPartyContracts /></PrivateRoute>} />
      <Route path="/contracts" element={<PrivateRoute><Contracts /></PrivateRoute>} />
      <Route path="/contracts/:id" element={<PrivateRoute><ContractDetails /></PrivateRoute>} />
      <Route path="/contracts/:id/digi" element={<PrivateRoute><DigiContract /></PrivateRoute>} />
      <Route path="/digi-contracts/:id" element={<PrivateRoute><DigiContractView /></PrivateRoute>} />
      <Route path="/digi-contracts" element={<PrivateRoute><DigiContractList /></PrivateRoute>} />
      <Route path="/digicontract/view/:id" element={<PrivateRoute><DigiContractView /></PrivateRoute>} />
      <Route path="/contracts/:id/messages" element={<PrivateRoute><ContractMessages /></PrivateRoute>} />
      <Route path="/payments" element={<PrivateRoute><Payments /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="min-h-screen">
          <AppRoutes />
          <ToastContainer position="top-right" autoClose={3000} />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
