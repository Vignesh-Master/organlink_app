import { Link } from "react-router-dom";
import {
  Heart,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="bg-medical-600 p-2 rounded-lg">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold">OrganLink</span>
                <p className="text-sm text-gray-400">Connecting Lives</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Leading the future of organ donation and transplantation through
              technology, blockchain verification, and AI-powered matching
              systems.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-gray-400 hover:text-medical-400 transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-medical-400 transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-medical-400 transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-medical-400 transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <nav className="space-y-2">
              <Link
                to="/"
                className="block text-gray-400 hover:text-white transition-colors"
              >
                Home
              </Link>
              <Link
                to="/about"
                className="block text-gray-400 hover:text-white transition-colors"
              >
                About Us
              </Link>
              <Link
                to="/organ-info"
                className="block text-gray-400 hover:text-white transition-colors"
              >
                Organ Information
              </Link>
              <Link
                to="/faqs"
                className="block text-gray-400 hover:text-white transition-colors"
              >
                FAQs
              </Link>
              <Link
                to="/contact"
                className="block text-gray-400 hover:text-white transition-colors"
              >
                Contact
              </Link>
            </nav>
          </div>

          {/* For Organizations */}
          <div>
            <h3 className="text-lg font-semibold mb-4">For Organizations</h3>
            <nav className="space-y-2">
              <Link
                to="/hospital/login"
                className="block text-gray-400 hover:text-white transition-colors"
              >
                Hospital Portal
              </Link>
              <Link
                to="/organization/login"
                className="block text-gray-400 hover:text-white transition-colors"
              >
                Organization Portal
              </Link>
              <Link
                to="/admin/login"
                className="block text-gray-400 hover:text-white transition-colors"
              >
                Admin Portal
              </Link>
              <Link
                to="/legal"
                className="block text-gray-400 hover:text-white transition-colors"
              >
                Legal & Compliance
              </Link>
            </nav>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-medical-400" />
                <div>
                  <p className="text-sm text-gray-400">Emergency Hotline</p>
                  <p className="text-white">+1-800-ORGAN</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-medical-400" />
                <div>
                  <p className="text-sm text-gray-400">Email Support</p>
                  <p className="text-white">support@organlink.org</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-medical-400" />
                <div>
                  <p className="text-sm text-gray-400">Headquarters</p>
                  <p className="text-white">Global Network</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-400 text-sm">
            © 2025 OrganLink. All rights reserved. Saving lives through
            technology.
          </div>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link
              to="/privacy"
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              to="/legal"
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Legal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
