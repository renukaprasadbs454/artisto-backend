import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Company from "./pages/Company";
import Opportunities from "./pages/Opportunities";
import Dashboard from "./pages/Dashboard";
import Application from "./pages/Application";
import OpportunitiesDetails from "./pages/OpportunitiesDetails";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/company" element={<Company />} />
      <Route path="/opportunities" element={<Opportunities />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/application" element={<Application />} />
      <Route path="/opportunities/:id" element={<OpportunitiesDetails />} />
    </Routes>
  );
}

export default App;