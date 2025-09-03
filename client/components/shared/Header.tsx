import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const logoUrl =
  "https://cdn.builder.io/api/v1/image/assets%2F405002c998c64b82876ceae617ac1008%2F978370ad4ac940eaaf623de01884e4fb";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const smoothTo = (id?: string) => (e: React.MouseEvent) => {
    if (!id) return;
    e.preventDefault();
    const el = document.querySelector(id) as HTMLElement | null;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img
              src={logoUrl}
              alt="OrganLink"
              className="h-8 w-8 object-contain"
            />
            <span className="text-xl font-bold text-gray-900">OrganLink</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="#home"
              onClick={smoothTo("#home")}
              className="text-gray-600 hover:text-medical-600 font-medium transition-colors"
            >
              Home
            </a>
            <a
              href="#features"
              onClick={smoothTo("#features")}
              className="text-gray-600 hover:text-medical-600 font-medium transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={smoothTo("#how-it-works")}
              className="text-gray-600 hover:text-medical-600 font-medium transition-colors"
            >
              How It Works
            </a>
            <a
              href="#testimonials"
              onClick={smoothTo("#testimonials")}
              className="text-gray-600 hover:text-medical-600 font-medium transition-colors"
            >
              Testimonials
            </a>
            <a
              href="#contact"
              onClick={smoothTo("#contact")}
              className="text-gray-600 hover:text-medical-600 font-medium transition-colors"
            >
              Contact
            </a>
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6 text-gray-600" />
            ) : (
              <Menu className="h-6 w-6 text-gray-600" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <nav className="flex flex-col space-y-3">
              <a
                href="#home"
                className="text-gray-600 hover:text-medical-600 font-medium py-2"
                onClick={(e) => {
                  smoothTo("#home")(e);
                  setIsMobileMenuOpen(false);
                }}
              >
                Home
              </a>
              <a
                href="#features"
                className="text-gray-600 hover:text-medical-600 font-medium py-2"
                onClick={(e) => {
                  smoothTo("#features")(e);
                  setIsMobileMenuOpen(false);
                }}
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-gray-600 hover:text-medical-600 font-medium py-2"
                onClick={(e) => {
                  smoothTo("#how-it-works")(e);
                  setIsMobileMenuOpen(false);
                }}
              >
                How It Works
              </a>
              <a
                href="#testimonials"
                className="text-gray-600 hover:text-medical-600 font-medium py-2"
                onClick={(e) => {
                  smoothTo("#testimonials")(e);
                  setIsMobileMenuOpen(false);
                }}
              >
                Testimonials
              </a>
              <a
                href="#contact"
                className="text-gray-600 hover:text-medical-600 font-medium py-2"
                onClick={(e) => {
                  smoothTo("#contact")(e);
                  setIsMobileMenuOpen(false);
                }}
              >
                Contact
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
