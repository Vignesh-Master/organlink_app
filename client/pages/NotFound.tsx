import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Building2, Heart } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-50 via-white to-medical-100 py-16 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <div className="text-[100px] leading-none font-extrabold text-gray-900">
          404
        </div>
        <h1 className="text-3xl font-bold mt-2 mb-3">Page Not Found</h1>
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="bg-blue-50 rounded-xl p-6 mb-8">
          <p className="text-sm text-blue-800 mb-4">
            Looking for Medical Access?
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/hospital/login"
              className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 border text-medical-700 hover:bg-medical-50"
            >
              <Heart className="h-4 w-4 mr-2" /> Hospital Portal
            </Link>
            <Link
              to="/organization/login"
              className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 border text-medical-700 hover:bg-medical-50"
            >
              <Building2 className="h-4 w-4 mr-2" /> Organization Portal
            </Link>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-medical-600 px-6 py-3 text-white hover:bg-medical-700"
          >
            Back to Home <ArrowLeft className="h-4 w-4 ml-2" />
          </Link>
          <a
            href="/contact"
            className="inline-flex items-center justify-center rounded-md border px-6 py-3 text-medical-700 border-medical-200 hover:bg-medical-50"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
