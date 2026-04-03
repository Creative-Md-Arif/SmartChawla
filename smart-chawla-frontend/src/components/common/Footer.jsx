import { Link } from "react-router-dom";
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { name: "About Us", href: "/about" },
      { name: "Contact", href: "/contact" },
      { name: "Careers", href: "/careers" },
      { name: "Blog", href: "/blog" },
    ],
    support: [
      { name: "Help Center", href: "/help" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Refund Policy", href: "/refund" },
    ],
    quickLinks: [
      { name: "Shop", href: "/shop" },
      { name: "Courses", href: "/courses" },
      { name: "Categories", href: "/categories" },
      { name: "Offers", href: "/offers" },
    ],
  };

  const socialLinks = [
    { name: "Facebook", icon: Facebook, href: "#" },
    { name: "Twitter", icon: Twitter, href: "#" },
    { name: "Instagram", icon: Instagram, href: "#" },
    { name: "YouTube", icon: Youtube, href: "#" },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800 w-full overflow-hidden">
      {/* Main Footer Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link
              to="/"
              className="flex items-center space-x-3 mb-5 group w-max"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-xl leading-none">
                  S
                </span>
              </div>
              <span className="text-xl font-bold text-white tracking-tight leading-none">
                Smart Chawla
              </span>
            </Link>
            <p className="text-gray-400 mb-6 max-w-sm text-sm leading-relaxed min-h-[60px]">
              Your one-stop destination for quality products and online courses.
              Learn, shop, and grow with us.
            </p>

            {/* Contact Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 h-6">
                <Mail className="w-5 h-5 text-purple-500 flex-shrink-0" />
                <span className="text-sm truncate leading-none">
                  support@smartchawla.com
                </span>
              </div>
              <div className="flex items-center space-x-3 h-6">
                <Phone className="w-5 h-5 text-purple-500 flex-shrink-0" />
                <span className="text-sm leading-none">+880 1XXX-XXXXXX</span>
              </div>
              <div className="flex items-start space-x-3 min-h-[24px]">
                <MapPin className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm leading-tight">Dhaka, Bangladesh</span>
              </div>
            </div>
          </div>

          {/* Links Columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:col-span-3 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider h-5">
                Quick Links
              </h3>
              <ul className="space-y-3">
                {footerLinks.quickLinks.map((link) => (
                  <li key={link.name} className="h-5">
                    <Link
                      to={link.href}
                      className="text-gray-400 hover:text-purple-400 transition-colors text-sm block leading-none"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider h-5">
                Company
              </h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.name} className="h-5">
                    <Link
                      to={link.href}
                      className="text-gray-400 hover:text-purple-400 transition-colors text-sm block leading-none"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <h3 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider h-5">
                Support
              </h3>
              <ul className="space-y-3">
                {footerLinks.support.map((link) => (
                  <li key={link.name} className="h-5">
                    <Link
                      to={link.href}
                      className="text-gray-400 hover:text-purple-400 transition-colors text-sm block leading-none"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="mt-16 pt-8 border-t border-gray-800">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left min-h-[52px]">
              <h3 className="text-white font-bold text-xl leading-tight">
                Subscribe to our newsletter
              </h3>
              <p className="text-gray-400 text-sm mt-2 leading-tight">
                Get the latest updates on new products and courses
              </p>
            </div>

            <form
              className="flex flex-col sm:flex-row w-full max-w-md gap-3 sm:gap-0"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder="Enter your email"
                required
                className="w-full h-[48px] px-4 bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-purple-500 text-sm sm:rounded-l-lg sm:rounded-r-none rounded-lg transition-all"
              />
              <button
                type="submit"
                className="w-full sm:w-auto h-[48px] px-8 bg-purple-600 text-white font-bold text-sm sm:rounded-r-lg sm:rounded-l-none rounded-lg hover:bg-purple-700 active:scale-95 transition-all shadow-lg flex-shrink-0"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-gray-950 border-t border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Copyright */}
            <p className="text-gray-500 text-xs text-center md:text-left order-3 md:order-1 h-4 flex items-center">
              © {currentYear}{" "}
              <span className="text-gray-400 font-medium ml-1">
                Smart Chawla
              </span>
              . All rights reserved.
            </p>

            {/* Social Links */}
            <div className="flex items-center space-x-4 order-1 md:order-2">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-purple-600 text-gray-400 hover:text-white transition-all flex-shrink-0 shadow-inner"
                  aria-label={social.name}
                >
                  <social.icon
                    className="w-5 h-5 flex-shrink-0"
                    strokeWidth={1.5}
                  />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
