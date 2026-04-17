import { Link } from "react-router-dom";
import CircloLogo from "@/components/CircloLogo";

const Footer = () => (
  <footer className="w-full border-t border-border/40 bg-card/60 mt-auto">
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
        <div className="col-span-2 md:col-span-1">
          <CircloLogo variant="full" size="md" theme="light" />
          <p className="text-sm text-muted-foreground mt-3 max-w-xs">
            The sports platform where content meets coaching. Find your circle.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-bold text-foreground mb-3">Platform</h4>
          <ul className="space-y-2">
            <li><Link to="/discover" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Discover Coaches</Link></li>
            <li><Link to="/plays" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Watch Plays</Link></li>
            <li><Link to="/community" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Communities</Link></li>
            <li><Link to="/pro" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Circlo Pro</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-bold text-foreground mb-3">For Coaches</h4>
          <ul className="space-y-2">
            <li><Link to="/signup" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Become a Coach</Link></li>
            <li><Link to="/coach-dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Coach Dashboard</Link></li>
            <li><Link to="/schedule" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Manage Schedule</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-bold text-foreground mb-3">Account</h4>
          <ul className="space-y-2">
            <li><Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Log In</Link></li>
            <li><Link to="/signup" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign Up</Link></li>
            <li><Link to="/profile" className="text-sm text-muted-foreground hover:text-foreground transition-colors">My Profile</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/30 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Circlo. All rights reserved.</p>
        <div className="flex items-center gap-4 flex-wrap justify-center">
          <Link to="/legal/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
          <Link to="/legal/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
          <Link to="/legal/waiver" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Waiver</Link>
          <Link to="/legal/coach-agreement" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Coach Agreement</Link>
          <Link to="/legal/cookies" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Cookies</Link>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
