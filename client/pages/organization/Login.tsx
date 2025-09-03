import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import Layout from "@/components/shared/Layout";
import {
  Shield,
  Building2,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";

export default function OrganizationLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username || !password) {
      setError("Enter email and password");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/organization/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem("organization_token", data.token);
        navigate("/organization/dashboard");
      } else {
        setError(data.error || "Invalid credentials");
      }
    } catch (err) {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout showHeader={false} showFooter={false}>
      <div className="min-h-[80vh] bg-gradient-to-br from-medical-50 via-white to-medical-100 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link to="/" className="text-medical-700 flex items-center mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
          </Link>

          <div className="text-center mb-6">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-medical-600 flex items-center justify-center mb-3">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Organization Portal</h1>
            <p className="text-sm text-gray-600">Policy & Governance</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-2">
              <Card className="shadow-lg border-0">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                    <Building2 className="h-5 w-5 text-medical-600 mr-2" />{" "}
                    Organization Sign In
                  </h2>
                  <p className="text-xs text-gray-600 mb-4">
                    Use the organization's contact email and the password set by
                    the Admin. After sign-in, you’ll be taken to the internal
                    portal (no public footer/links).
                  </p>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        placeholder="Enter the organization's contact email"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={loading}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Use the Email Address set when the Admin registered your
                        organization.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={show ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={loading}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShow(!show)}
                        >
                          {show ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    {error && (
                      <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        {error}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <Link
                        to="/contact"
                        className="text-sm text-medical-700 hover:underline"
                      >
                        Need to join? Contact administration
                      </Link>
                      <Button type="submit" disabled={loading}>
                        {loading ? (
                          "Signing in..."
                        ) : (
                          <span className="inline-flex items-center">
                            Sign In <ArrowRight className="h-4 w-4 ml-2" />
                          </span>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="shadow-md border-0">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-3">
                    Participating Organizations
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-2 list-disc ml-5">
                    <li>Global Transplant Alliance</li>
                    <li>Hope Foundation</li>
                    <li>Medical Council Network</li>
                    <li>Health Policy Board</li>
                    <li>National Kidney Forum</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
