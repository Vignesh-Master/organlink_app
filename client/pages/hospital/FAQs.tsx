import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Heart, Shield, Zap } from "lucide-react";
import HospitalLayout from "@/components/hospital/HospitalLayout";

const faqData = [
  {
    category: "General",
    icon: HelpCircle,
    faqs: [
      {
        question: "What is OrganLink?",
        answer: "OrganLink is a blockchain-powered organ donation management system that connects hospitals, patients, and donors. It ensures secure, transparent, and efficient organ matching while maintaining data integrity through blockchain technology."
      },
      {
        question: "How do I register patients and donors?",
        answer: "Use the 'Register Patient' or 'Register Donor' options from the sidebar. Complete the multi-step process including personal details, medical information, and signature verification. All data is securely stored and verified through blockchain."
      },
      {
        question: "What is the AI matching system?",
        answer: "Our AI matching algorithm analyzes blood compatibility (40%), urgency level (30%), geographical distance (20%), and time factors (10%) to find the best organ matches across all connected hospitals."
      }
    ]
  },
  {
    category: "Security & Blockchain",
    icon: Shield,
    faqs: [
      {
        question: "How is patient data protected?",
        answer: "All patient data is encrypted and stored securely. Signatures are verified through OCR technology and stored on IPFS. Critical records are immutably recorded on the Ethereum blockchain for transparency and security."
      },
      {
        question: "What is IPFS and why do we use it?",
        answer: "IPFS (InterPlanetary File System) is a distributed storage system used for storing signature documents and medical files. It ensures data availability and prevents tampering while maintaining privacy."
      },
      {
        question: "How does blockchain verification work?",
        answer: "Each patient and donor registration is recorded as a transaction on the Ethereum blockchain. This creates an immutable audit trail and ensures data integrity across all participating hospitals."
      }
    ]
  },
  {
    category: "Organ Matching",
    icon: Heart,
    faqs: [
      {
        question: "How does cross-hospital matching work?",
        answer: "Our system automatically searches for organ matches across all connected hospitals in the network. When a match is found, both hospitals are notified and can coordinate the organ transfer process."
      },
      {
        question: "What factors determine match compatibility?",
        answer: "Matching considers blood type compatibility, organ type, patient urgency level, geographical distance between hospitals, and waiting time. Our AI algorithm weights these factors to find optimal matches."
      },
      {
        question: "How are urgent cases prioritized?",
        answer: "Critical and high-urgency patients receive priority in the matching algorithm. The system also provides real-time notifications to ensure rapid response for life-threatening cases."
      }
    ]
  },
  {
    category: "System Usage",
    icon: Zap,
    faqs: [
      {
        question: "How do I update patient information?",
        answer: "Patient information can be updated through the 'View Patients' section. Click on any patient record to view details and make necessary updates. All changes are logged and verified."
      },
      {
        question: "What should I do if signature verification fails?",
        answer: "If OCR verification fails, try uploading a clearer image of the signature. Ensure the signature is legible and properly scanned. Contact system support if issues persist."
      },
      {
        question: "How do I respond to matching requests?",
        answer: "Go to the 'AI Matching' section and check the 'Incoming Matches' tab. Review each request and respond with 'Accept' or 'Reject' based on your hospital's capacity and medical assessment."
      },
      {
        question: "Can I export patient/donor data?",
        answer: "Yes, you can export filtered data using the export functions in the 'View Patients' and 'View Donors' sections. Exported data maintains privacy compliance and includes necessary medical information."
      }
    ]
  }
];

export default function HospitalFAQs() {
  return (
    <HospitalLayout title="Frequently Asked Questions" subtitle="Get answers to common questions about the OrganLink system">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <HelpCircle className="h-5 w-5 text-medical-600" />
              <span>Hospital Portal Guide</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 leading-relaxed">
              Welcome to the OrganLink Hospital Portal. This system helps you manage organ donation and transplant operations with cutting-edge AI matching and blockchain security. Find answers to common questions below.
            </p>
          </CardContent>
        </Card>

        {/* FAQ Categories */}
        {faqData.map((category, categoryIndex) => (
          <Card key={categoryIndex}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="p-2 bg-medical-100 rounded-lg">
                  <category.icon className="h-5 w-5 text-medical-600" />
                </div>
                <span>{category.category}</span>
                <Badge variant="secondary" className="ml-auto">
                  {category.faqs.length} questions
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="space-y-2">
                {category.faqs.map((faq, faqIndex) => (
                  <AccordionItem
                    key={faqIndex}
                    value={`${categoryIndex}-${faqIndex}`}
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="text-left font-medium">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 leading-relaxed pt-2">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        ))}

        {/* Contact Support */}
        <Card className="bg-medical-50 border-medical-200">
          <CardContent className="p-6">
            <div className="text-center space-y-3">
              <div className="p-3 bg-medical-100 rounded-full w-fit mx-auto">
                <HelpCircle className="h-6 w-6 text-medical-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Still have questions?
                </h3>
                <p className="text-gray-600 mt-1">
                  Our support team is available 24/7 to help with any technical issues or questions about the system.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 justify-center text-sm text-gray-600">
                <span>📧 support@organlink.org</span>
                <span className="hidden sm:inline">•</span>
                <span>📞 +1 (555) 123-4567</span>
                <span className="hidden sm:inline">•</span>
                <span>💬 Live chat available</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </HospitalLayout>
  );
}
