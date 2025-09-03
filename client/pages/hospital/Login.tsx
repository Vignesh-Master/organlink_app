import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Eye,
  EyeOff,
  Heart,
  MapPin,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { useHospitalAuth } from "@/contexts/HospitalAuthContext";
import { useToast } from "@/contexts/ToastContext";

interface Locations {
  [country: string]: {
    [state: string]: {
      [city: string]: Array<{
        id: string;
        name: string;
      }>;
    };
  };
}

interface SelectedHospital {
  id: string;
  name: string;
  location: string;
}

export default function HospitalLogin() {
  // Step 1: Location Selection
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedHospital, setSelectedHospital] =
    useState<SelectedHospital | null>(null);
  const [locations, setLocations] = useState<Locations>({});
  const [loadingLocations, setLoadingLocations] = useState(true);

  // Step 2: Credentials
  const [hospitalId, setHospitalId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Forgot Password
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const { login, hospital, requestPasswordReset } = useHospitalAuth();
  const { error: showError, success: showSuccess } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (hospital) {
      navigate("/hospital/dashboard");
    }
  }, [hospital, navigate]);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await fetch("/api/hospital/auth/locations");

      if (!response.ok) {
        throw new Error(`Failed to fetch locations: ${response.status}`);
      }

      const data = await response.json();
      setLocations(data);
    } catch (error) {
      console.error("Failed to fetch locations:", error);
      showError("Failed to load locations");
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleNextStep = () => {
    if (
      !selectedCountry ||
      !selectedState ||
      !selectedCity ||
      !selectedHospital
    ) {
      showError("Please select country, state, city, and hospital");
      return;
    }
    setHospitalId(selectedHospital.id);
    setCurrentStep(2);
  };

  const handleBackStep = () => {
    setCurrentStep(1);
    setPassword("");
    setShowForgotPassword(false);
  };

  const handleHospitalSelect = (hospitalId: string) => {
    const hospital = hospitals.find((h) => h.id === hospitalId);
    if (hospital) {
      setSelectedHospital({
        id: hospital.id,
        name: hospital.name,
        location: `${selectedCity}, ${selectedState}, ${selectedCountry}`,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospitalId || !password) {
      showError("Please enter hospital ID and password");
      return;
    }

    setIsLoading(true);

    const result = await login(hospitalId, password);

    if (result.success) {
      showSuccess("Login successful! Welcome to OrganLink");
      navigate("/hospital/dashboard");
    } else {
      showError(result.error || "Login failed");
    }

    setIsLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!hospitalId || !resetEmail) {
      showError("Please enter hospital ID and email");
      return;
    }

    const result = await requestPasswordReset(hospitalId, resetEmail);

    if (result.success) {
      showSuccess("Password reset request sent to admin for approval");
      setShowForgotPassword(false);
      setResetEmail("");
    } else {
      showError(result.error || "Failed to send reset request");
    }
  };

  const countries = Object.keys(locations);
  const sanitize = (arr: string[]) =>
    arr.filter((k) => k && k !== "null" && k !== "undefined");
  const states = selectedCountry
    ? sanitize(Object.keys(locations[selectedCountry] || {}))
    : [];
  const cities =
    selectedCountry && selectedState
      ? sanitize(Object.keys(locations[selectedCountry][selectedState] || {}))
      : [];
  const hospitals =
    selectedCountry && selectedState && selectedCity
      ? locations[selectedCountry][selectedState][selectedCity] || []
      : [];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left side - Login Form */}
        <div className="flex-1 flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-md lg:w-96">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="bg-medical-600 p-3 rounded-2xl">
                  <Heart className="h-8 w-8 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Hospital Portal
              </h2>
              <p className="text-sm text-gray-600">
                {currentStep === 1
                  ? "Select your hospital location"
                  : "Enter your login credentials"}
              </p>
            </div>

            <Card className="shadow-lg border-0">
              <CardContent className="p-8">
                {/* Step 1: Location Selection */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Label className="text-sm font-medium text-gray-700 flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        Select Country, State, City & Hospital
                      </Label>

                      {loadingLocations ? (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-medical-600 mx-auto"></div>
                          <p className="text-sm text-gray-500 mt-2">
                            Loading locations...
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3">
                          <Select
                            value={selectedCountry}
                            onValueChange={(value) => {
                              setSelectedCountry(value);
                              setSelectedState("");
                              setSelectedCity("");
                              setSelectedHospital(null);
                            }}
                          >
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Select Country" />
                            </SelectTrigger>
                            <SelectContent>
                              {countries.map((country) => (
                                <SelectItem key={country} value={country}>
                                  {country.charAt(0).toUpperCase() +
                                    country.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select
                            value={selectedState}
                            onValueChange={(value) => {
                              setSelectedState(value);
                              setSelectedCity("");
                              setSelectedHospital(null);
                            }}
                            disabled={!selectedCountry}
                          >
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Select State" />
                            </SelectTrigger>
                            <SelectContent>
                              {states.map((state) => (
                                <SelectItem key={state} value={state}>
                                  {state.charAt(0).toUpperCase() +
                                    state.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select
                            value={selectedCity}
                            onValueChange={(value) => {
                              setSelectedCity(value);
                              setSelectedHospital(null);
                            }}
                            disabled={!selectedState}
                          >
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Select City" />
                            </SelectTrigger>
                            <SelectContent>
                              {cities.map((city) => (
                                <SelectItem key={city} value={city}>
                                  {city.charAt(0).toUpperCase() + city.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select
                            value={selectedHospital?.id || ""}
                            onValueChange={handleHospitalSelect}
                            disabled={!selectedCity}
                          >
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Select Hospital" />
                            </SelectTrigger>
                            <SelectContent>
                              {hospitals.map((hospital) => (
                                <SelectItem
                                  key={hospital.id}
                                  value={hospital.id}
                                >
                                  {hospital.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {selectedHospital && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="font-medium text-blue-900">
                          {selectedHospital.name}
                        </h3>
                        <p className="text-sm text-blue-700">
                          {selectedHospital.location}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          Hospital ID: {selectedHospital.id}
                        </p>
                      </div>
                    )}

                    <Button
                      onClick={handleNextStep}
                      disabled={!selectedHospital || loadingLocations}
                      className="w-full h-12 bg-medical-600 hover:bg-medical-700 text-white"
                    >
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}

                {/* Step 2: Credentials */}
                {currentStep === 2 && (
                  <>
                    {!showForgotPassword ? (
                      <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Selected Hospital Info */}
                        {selectedHospital && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-medium text-gray-900">
                              {selectedHospital.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {selectedHospital.location}
                            </p>
                          </div>
                        )}

                        <div>
                          <Label
                            htmlFor="hospitalId"
                            className="text-sm font-medium text-gray-700"
                          >
                            Hospital ID *
                          </Label>
                          <Input
                            id="hospitalId"
                            type="text"
                            value={hospitalId}
                            onChange={(e) => setHospitalId(e.target.value)}
                            placeholder="Enter your hospital ID"
                            required
                            className="mt-1 h-12"
                            disabled={isLoading}
                          />
                        </div>

                        <div>
                          <Label
                            htmlFor="password"
                            className="text-sm font-medium text-gray-700"
                          >
                            Password *
                          </Label>
                          <div className="relative mt-1">
                            <Input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Enter your password"
                              required
                              className="h-12 pr-10"
                              disabled={isLoading}
                            />
                            <button
                              type="button"
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="text-center">
                          <button
                            type="button"
                            onClick={() => setShowForgotPassword(true)}
                            className="text-sm text-medical-600 hover:text-medical-700"
                          >
                            Forgot password?
                          </button>
                        </div>

                        <div className="flex gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleBackStep}
                            className="flex-1 h-12"
                          >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                          </Button>
                          <Button
                            type="submit"
                            className="flex-1 h-12 bg-medical-600 hover:bg-medical-700 text-white"
                            disabled={isLoading || !hospitalId || !password}
                          >
                            {isLoading ? "Signing in..." : "Sign In"}
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-6">
                        <div className="text-center">
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Request Password Reset
                          </h3>
                          <p className="text-sm text-gray-600">
                            Your request will be sent to admin for approval
                          </p>
                        </div>

                        <div>
                          <Label
                            htmlFor="resetEmail"
                            className="text-sm font-medium text-gray-700"
                          >
                            Email Address *
                          </Label>
                          <Input
                            id="resetEmail"
                            type="email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            placeholder="Enter your registered email"
                            required
                            className="mt-1 h-12"
                          />
                        </div>

                        <div className="flex gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            className="flex-1 h-12"
                            onClick={() => setShowForgotPassword(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            className="flex-1 h-12 bg-medical-600 hover:bg-medical-700"
                            onClick={handleForgotPassword}
                            disabled={!hospitalId || !resetEmail}
                          >
                            Send Request
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="mt-6 text-center">
                  <p className="text-xs text-gray-500">
                    Protected by advanced security protocols
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right side - Image and Content */}
        <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-medical-600 via-medical-700 to-medical-800 relative">
          <div className="flex flex-col justify-center px-12 py-12 text-white relative z-10">
            <div className="mb-8">
              <img
                src="https://images.pexels.com/photos/33474165/pexels-photo-33474165.jpeg"
                alt="Hospital Professional"
                className="w-80 h-80 object-cover rounded-2xl mx-auto mb-8"
              />
            </div>

            <div className="text-center">
              <h1 className="text-3xl font-bold mb-4">
                Hospital Management Portal
              </h1>
              <p className="text-lg text-medical-100 leading-relaxed max-w-md mx-auto">
                Securely manage patient registrations, donor coordination, and
                organ matching with advanced blockchain verification and
                AI-powered matching algorithms.
              </p>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-10 right-10 w-20 h-20 bg-white/10 rounded-full"></div>
          <div className="absolute bottom-20 left-10 w-16 h-16 bg-medical-400/20 rounded-full"></div>
          <div className="absolute top-1/3 right-1/4 w-12 h-12 bg-white/5 rounded-full"></div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 lg:bg-transparent py-4 text-center border-t lg:border-t-0">
        <p className="text-xs text-gray-500">
          © 2025 OrganLink. All rights reserved.
        </p>
        <div className="flex justify-center space-x-4 mt-2 text-xs">
          <a href="#" className="text-gray-500 hover:text-gray-700">
            Privacy Policy
          </a>
          <span className="text-gray-300">|</span>
          <a href="#" className="text-gray-500 hover:text-gray-700">
            Terms of Service
          </a>
          <span className="text-gray-300">|</span>
          <a href="#" className="text-gray-500 hover:text-gray-700">
            Support
          </a>
        </div>
      </div>
    </div>
  );
}
