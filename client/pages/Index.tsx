import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import Layout from "@/components/shared/Layout";
import {
  Shield,
  Zap,
  Users,
  ArrowRight,
  Activity,
  Award,
  Globe,
  Lock,
  Database,
  Brain,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

function useInView(ref: React.RefObject<Element>, rootMargin = "0px") {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
          }
        });
      },
      { root: null, rootMargin, threshold: 0.2 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, rootMargin]);
  return inView;
}

function CountUpNumber({
  value,
  suffix = "",
}: {
  value: number;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);

  useEffect(() => {
    if (!inView) return;
    let start: number | null = null;
    const duration = 1200; // ms
    const startVal = 0;
    const endVal = value;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(startVal + (endVal - startVal) * eased);
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(step);
    };
    const id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [inView, value]);

  const formatted = display.toLocaleString();
  return (
    <div ref={ref} className="text-2xl font-bold">
      {formatted}
      {suffix}
    </div>
  );
}

type Testimonial = {
  text: string;
  name: string;
  title: string;
  org: string;
  photo: string;
};

function chunk<T>(arr: T[], size: number): T[][] {
  const res: T[][] = [];
  for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size));
  return res;
}

function TestimonialsCarousel() {
  const testimonials: Testimonial[] = [
    {
      text: "OrganLink helped us reduce matching time drastically while keeping records transparent.",
      name: "Dr. Emily Rodriguez",
      title: "Nephrology Director",
      org: "Apollo Hospital, Chennai",
      photo:
        "https://cdn.builder.io/api/v1/image/assets%2F405002c998c64b82876ceae617ac1008%2Fcf4e58ef984543b58df3e13a88ca2ddb?format=webp&width=200",
    },
    {
      text: "The blockchain trail and IPFS storage give unparalleled confidence in the process.",
      name: "Dr. James Wilson",
      title: "Liver Transplant Specialist",
      org: "Global Health Org",
      photo:
        "https://cdn.builder.io/api/v1/image/assets%2F405002c998c64b82876ceae617ac1008%2F2d318e7a6a764659878aa76289d2b0f4?format=webp&width=200",
    },
    {
      text: "Real-time notifications connected us with donors faster than ever.",
      name: "Dr. Maria Garcia",
      title: "Pediatric Transplant Surgeon",
      org: "City Care Hospital",
      photo:
        "https://cdn.builder.io/api/v1/image/assets%2F405002c998c64b82876ceae617ac1008%2F4a84ccdd532a49b888b9ae232b4b35e8?format=webp&width=200",
    },
    {
      text: "Outstanding platform! The AI matching has revolutionized how we find compatible donors.",
      name: "Dr. Ahmed Khan",
      title: "Cardio-Thoracic Surgeon",
      org: "MedCity Hospital",
      photo:
        "https://cdn.builder.io/api/v1/image/assets%2F405002c998c64b82876ceae617ac1008%2F8ce3b8f5ed784f5195df6ca3fa7b1741?format=webp&width=200",
    },
    {
      text: "For pediatric cases, every second counts. OrganLink’s speed has saved countless young lives.",
      name: "Dr. Sarah Lee",
      title: "Pediatrician",
      org: "Children's Health Center",
      photo:
        "https://cdn.builder.io/api/v1/image/assets%2F405002c998c64b82876ceae617ac1008%2F75632058974a40e7822c919dc3add4cb?format=webp&width=200",
    },
    {
      text: "Seamless onboarding and secure workflows. Our teams collaborate with confidence.",
      name: "Dr. Ravi Patel",
      title: "Transplant Coordinator",
      org: "CarePlus Hospitals",
      photo:
        "https://cdn.builder.io/api/v1/image/assets%2F405002c998c64b82876ceae617ac1008%2Fd7c818018c9b40e2a1e5eaf655a1a32a?format=webp&width=200",
    },
  ];

  const slides = chunk(testimonials, 3);
  const [index, setIndex] = useState(0);
  const timerRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const next = () => setIndex((i) => (i + 1) % slides.length);
    timerRef.current = window.setInterval(next, 6500);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [slides.length]);

  const onMouseEnter = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
  };
  const onMouseLeave = () => {
    timerRef.current = window.setInterval(
      () => setIndex((i) => (i + 1) % slides.length),
      4000,
    );
  };

  return (
    <div
      className="max-w-5xl mx-auto"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="overflow-hidden" ref={containerRef}>
        <div
          className="flex transition-transform duration-1000"
          style={{
            transform: `translateX(-${index * 100}%)`,
            width: `${slides.length * 100}%`,
          }}
        >
          {slides.map((group, gi) => (
            <div
              key={gi}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full shrink-0 px-1 md:px-0"
              style={{ width: `${100 / slides.length}%` }}
            >
              {group.map((t, i) => (
                <Card key={t.name + i} className="border-0 shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <img
                        src={t.photo}
                        alt={t.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-semibold text-gray-900">
                          {t.name}
                        </div>
                        <div className="text-xs text-gray-500">{t.title}</div>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-3">“{t.text}”</p>
                    <div className="text-sm text-gray-500">{t.org}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center mt-6 space-x-2">
        {slides.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2 w-2 rounded-full ${i === index ? "bg-medical-600" : "bg-gray-300"}`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </div>
  );
}

function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [institute, setInstitute] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await new Promise((res) => setTimeout(res, 600));
      setSubmitted(true);
      setName("");
      setEmail("");
      setInstitute("");
      setMessage("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white rounded-xl shadow-sm border p-6 space-y-4"
    >
      {submitted && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-md p-3">
          Thanks for reaching out. We will get back to you shortly.
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Your name"
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@email.com"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="institute">Institute or Organization</Label>
        <Input
          id="institute"
          value={institute}
          onChange={(e) => setInstitute(e.target.value)}
          required
          placeholder="Hospital or Organization"
        />
      </div>
      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          placeholder="Tell us about your needs"
          rows={5}
        />
      </div>
      <Button type="submit" disabled={submitting} className="w-full md:w-auto">
        {submitting ? "Sending..." : "Send Message"}
      </Button>
    </form>
  );
}

export default function Index() {
  return (
    <Layout>
      {/* Hero Section */}
      <section
        className="bg-gradient-to-br from-medical-50 via-white to-medical-100 pt-12 pb-20"
        id="home"
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="animate-fade-in text-center md:text-left">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Revolutionizing{" "}
                <span className="text-medical-600">Organ Donation</span>
                <span className="block">Through Technology</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-xl">
                Secure, transparent, and efficient platform connecting
                hospitals, organizations, and lives through blockchain-powered
                organ matching and allocation systems.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 md:justify-start justify-center mb-4">
                <a
                  href="#contact"
                  className="group inline-flex items-center justify-center rounded-md bg-medical-600 px-8 py-3 text-white shadow hover:bg-medical-700"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-200 group-hover:-rotate-90" />
                </a>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center rounded-md border px-8 py-3 text-medical-700 border-medical-200 hover:bg-medical-50"
                >
                  Learn More
                </a>
              </div>
            </div>
            <div className="flex justify-center md:justify-end">
              <div className="relative p-3 md:p-6 rounded-2xl bg-white shadow-xl border overflow-hidden">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F405002c998c64b82876ceae617ac1008%2Fd52b330c498649afbd923c9dbfd7267d?format=webp"
                  alt="Healthcare professionals illustrating OrganLink"
                  className="w-full max-w-md md:max-w-xl lg:max-w-2xl h-auto object-contain"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="bg-medical-600 text-white mt-8">
          <div className="container mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
            <div>
              <CountUpNumber value={100000} suffix="+" />
              <div className="text-white/80 text-sm">
                People waiting for organs
              </div>
            </div>
            <div>
              <CountUpNumber value={17} suffix="+" />
              <div className="text-white/80 text-sm">
                People die daily waiting
              </div>
            </div>
            <div>
              <CountUpNumber value={95} suffix="%" />
              <div className="text-white/80 text-sm">
                Success rate with AI matching
              </div>
            </div>
            <div>
              <CountUpNumber value={1500} suffix="+" />
              <div className="text-white/80 text-sm">Hospitals Connected</div>
            </div>
            <div className="hidden md:block">
              <CountUpNumber value={3600} suffix="+" />
              <div className="text-white/80 text-sm">
                Transplants Facilitated
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-white" id="about">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="order-2 md:order-1">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                About OrganLink
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                OrganLink is a secure, global platform that connects hospitals
                and organizations to accelerate life-saving organ transplants.
                We combine transparent blockchain records, decentralized IPFS
                storage, and intelligent matching to ensure trust, speed, and
                equity in every step of the process.
              </p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start space-x-3">
                  <span className="mt-2 h-2 w-2 rounded-full bg-medical-600" />
                  <span>Immutable records for end‑to‑end transparency.</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="mt-2 h-2 w-2 rounded-full bg-medical-600" />
                  <span>AI-assisted matching improves speed and outcomes.</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="mt-2 h-2 w-2 rounded-full bg-medical-600" />
                  <span>
                    Global network connecting hospitals and organizations.
                  </span>
                </li>
              </ul>
            </div>
            <div className="order-1 md:order-2">
              <div className="relative mx-auto max-w-xl">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F405002c998c64b82876ceae617ac1008%2F4a84ccdd532a49b888b9ae232b4b35e8?format=webp&width=800"
                  alt="OrganLink about illustration"
                  className="w-full h-auto rounded-xl shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white" id="features">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Cutting-Edge Technology for Life-Saving Solutions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform combines cutting-edge blockchain, AI, and biometric
              verification to ensure secure, transparent, and efficient organ
              matching.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow border-0 shadow-md">
              <CardContent className="p-6">
                <div className="bg-medical-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-medical-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  AI-Powered Matching
                </h3>
                <p className="text-gray-600">
                  Advanced algorithms analyze compatibility factors to find
                  optimal donor-patient matches across our global network.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-0 shadow-md">
              <CardContent className="p-6">
                <div className="bg-medical-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-medical-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Blockchain Security
                </h3>
                <p className="text-gray-600">
                  Immutable records on Ethereum Sepolia ensure complete
                  transparency and tamper-proof documentation of all
                  transactions.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-0 shadow-md">
              <CardContent className="p-6">
                <div className="bg-medical-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Lock className="h-6 w-6 text-medical-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  OCR Verification
                </h3>
                <p className="text-gray-600">
                  Signature verification using Tesseract.js OCR technology
                  ensures authentic consent and prevents fraud.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-0 shadow-md">
              <CardContent className="p-6">
                <div className="bg-medical-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Database className="h-6 w-6 text-medical-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  IPFS Storage
                </h3>
                <p className="text-gray-600">
                  Decentralized storage via Pinata API ensures documents are
                  permanent, accessible, and distributed globally.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-0 shadow-md">
              <CardContent className="p-6">
                <div className="bg-medical-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-medical-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Real-time Notifications
                </h3>
                <p className="text-gray-600">
                  Socket.IO powered instant alerts notify hospitals when matches
                  are found, reducing critical response times.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-0 shadow-md">
              <CardContent className="p-6">
                <div className="bg-medical-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-medical-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Global Network
                </h3>
                <p className="text-gray-600">
                  Connect hospitals and organizations worldwide for cross-border
                  organ matching and collaborative healthcare.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50" id="how-it-works">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              How OrganLink Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A streamlined process designed for maximum security, efficiency,
              and life-saving impact.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-medical-600 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
                <span className="text-white text-xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Register
              </h3>
              <p className="text-gray-600">
                Hospitals register donors and patients with secure signature
                verification
              </p>
            </div>

            <div className="text-center">
              <div className="bg-medical-600 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
                <span className="text-white text-xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Verify
              </h3>
              <p className="text-gray-600">
                OCR technology validates signatures and uploads documents to
                IPFS
              </p>
            </div>

            <div className="text-center">
              <div className="bg-medical-600 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
                <span className="text-white text-xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Match
              </h3>
              <p className="text-gray-600">
                AI algorithms find optimal matches based on compatibility
                factors
              </p>
            </div>

            <div className="text-center">
              <div className="bg-medical-600 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
                <span className="text-white text-xl font-bold">4</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Connect
              </h3>
              <p className="text-gray-600">
                Real-time notifications connect hospitals for life-saving
                procedures
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white" id="testimonials">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              What Our Partners Say
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Trusted by hospitals and organizations worldwide.
            </p>
          </div>
          <TestimonialsCarousel />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50" id="faqs">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to know about OrganLink.
            </p>
          </div>
          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border">
            <Accordion type="single" collapsible>
              <AccordionItem value="item-1" className="px-6">
                <AccordionTrigger className="py-5 text-left text-base">
                  How is patient data secured?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 leading-relaxed">
                  We use blockchain for immutable records and IPFS for
                  decentralized document storage. Encryption and strict access
                  controls keep data private while enabling necessary medical
                  access.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2" className="px-6">
                <AccordionTrigger className="py-5 text-left text-base">
                  What is the policy voting system?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 leading-relaxed">
                  Organizations propose and vote on policies. Once approved,
                  policies are transparently recorded and enforced across the
                  network.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3" className="px-6">
                <AccordionTrigger className="py-5 text-left text-base">
                  How does AI matching work?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 leading-relaxed">
                  Our algorithms consider blood group, tissue type, urgency,
                  distance and more to recommend optimal donor–patient matches.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-white" id="contact">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Get in Touch
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Ready to revolutionize organ transplant matching at your
              institution?
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="space-y-6">
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-medical-600 mt-1" />
                <div>
                  <div className="text-sm text-gray-500">Email</div>
                  <div className="font-medium text-gray-900">
                    support@organlink.org
                  </div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Phone className="h-5 w-5 text-medical-600 mt-1" />
                <div>
                  <div className="text-sm text-gray-500">Phone</div>
                  <div className="font-medium text-gray-900">
                    +1 (800) ORGAN
                  </div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-medical-600 mt-1" />
                <div>
                  <div className="text-sm text-gray-500">Location</div>
                  <div className="font-medium text-gray-900">
                    Healthcare Innovation Hub
                  </div>
                </div>
              </div>
            </div>

            <ContactForm />
          </div>
        </div>
      </section>

      {/* Portal Access Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Access Your Portal
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Secure, role-based access for hospitals, organizations, and
              administrators.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-medical-200">
              <CardContent className="p-8 text-center">
                <div className="bg-medical-100 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <Activity className="h-8 w-8 text-medical-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Hospital Portal
                </h3>
                <p className="text-gray-600 mb-6">
                  Register donors and patients, manage AI matching, and receive
                  real-time notifications.
                </p>
                <Button className="w-full" asChild>
                  <Link to="/hospital/login">Access Hospital Portal</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-medical-200">
              <CardContent className="p-8 text-center">
                <div className="bg-medical-100 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <Users className="h-8 w-8 text-medical-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Organization Portal
                </h3>
                <p className="text-gray-600 mb-6">
                  Propose policies, participate in voting, and manage
                  organizational guidelines.
                </p>
                <Button className="w-full" asChild>
                  <Link to="/organization/login">
                    Access Organization Portal
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-medical-200">
              <CardContent className="p-8 text-center">
                <div className="bg-medical-100 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <Award className="h-8 w-8 text-medical-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Admin Portal
                </h3>
                <p className="text-gray-600 mb-6">
                  Manage hospitals, organizations, monitor blockchain logs, and
                  system metrics.
                </p>
                <Button className="w-full" asChild>
                  <Link to="/admin/login">Access Admin Portal</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
}
