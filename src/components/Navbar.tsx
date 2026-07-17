import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="flex justify-between items-center px-8 py-4 shadow-md">
      <h1 className="text-2xl font-bold text-blue-600">Artisto</h1>

      <div className="space-x-6">
        <Link to="/">Home</Link>
        <Link to="/opportunities">Opportunities</Link>
        <Link to="/company">Companies</Link>
        <Link to="/login">Login</Link>
        <Link
          to="/register"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Register
        </Link>

        

      </div>
    </nav>
  );
}

export default Navbar;