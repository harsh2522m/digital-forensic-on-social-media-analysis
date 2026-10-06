import { Link } from 'react-router-dom';
import './Navigation.css';

function Navigation() {
  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          🔍 Digital Forensic Analysis
        </Link>
        <div className="nav-menu">
          <Link to="/" className="nav-link">
            Home
          </Link>
          <Link to="/investigations" className="nav-link">
            Investigations
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
