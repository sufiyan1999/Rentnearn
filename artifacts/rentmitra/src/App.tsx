import { AppLayout } from "./components/layout/AppLayout";
import { Route, Switch, Router as WouterRouter } from "wouter";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./components/theme-provider";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "sonner";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import ListingDetails from "./pages/ListingDetails";
import CreateListing from "./pages/CreateListing";
import Favourites from "./pages/Favourites";
import Categories from "./pages/Categories";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminListings from "./pages/AdminListings";
import AdminUsers from "./pages/AdminUsers";
import ForgotPassword from "./pages/ForgotPassword";
import BusinessProfile from "./pages/BusinessProfile";
// Legal pages
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import Disclaimer from "./pages/Disclaimer";
import Pricing from "./pages/Pricing";
// Info pages
import About from "./pages/About";
import FairUsagePolicy from "./pages/FairUsagePolicy";
import ProhibitedItems from "./pages/ProhibitedItems";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import Safety from "./pages/Safety";
import HowItWorks from "./pages/HowItWorks";
import ListYourItem from "./pages/ListYourItem";
import { MetaPixel } from "./components/MetaPixel";

const queryClient = new QueryClient();

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <p className="text-muted-foreground">Page not found</p>
    </div>
  );
}

function Router() {
  return (
    <AppLayout>
      <MetaPixel />
      <Switch>
        {/* Core */}
        <Route path="/" component={Home} />
        <Route path="/search" component={Search} />
        <Route path="/categories" component={Categories} />
        <Route path="/listings/new" component={CreateListing} />
        <Route path="/listings/:id/edit" component={CreateListing} />
        <Route path="/listings/:id" component={ListingDetails} />
        {/* Auth */}
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/forgot-password" component={ForgotPassword} />
        {/* User */}
        <Route path="/profile" component={Profile} />
        <Route path="/favourites" component={Favourites} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/business/:userId" component={BusinessProfile} />
        {/* Admin */}
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/listings" component={AdminListings} />
        <Route path="/admin/users" component={AdminUsers} />
        {/* Pricing */}
        <Route path="/pricing" component={Pricing} />
        {/* Info pages */}
        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />
        <Route path="/faq" component={FAQ} />
        <Route path="/safety" component={Safety} />
        <Route path="/how-it-works" component={HowItWorks} />
        <Route path="/list-your-item" component={ListYourItem} />
        {/* Legal pages */}
        <Route path="/privacy" component={PrivacyPolicy} />
        <Route path="/terms" component={TermsOfService} />
        <Route path="/cookies" component={CookiePolicy} />
        <Route path="/disclaimer" component={Disclaimer} />
        <Route path="/fair-usage-policy" component={FairUsagePolicy} />
        <Route path="/prohibited-items" component={ProhibitedItems} />
        {/* 404 */}
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster position="top-center" />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
