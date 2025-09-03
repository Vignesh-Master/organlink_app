import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Layout from "./Layout";
import { Construction, ArrowLeft, MessageCircle } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description: string;
  suggestedPrompt: string;
}

export default function PlaceholderPage({
  title,
  description,
  suggestedPrompt,
}: PlaceholderPageProps) {
  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-12 text-center">
              <div className="bg-medical-100 w-20 h-20 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Construction className="h-10 w-10 text-medical-600" />
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                {description}
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <div className="flex items-start space-x-3">
                  <MessageCircle className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                  <div className="text-left">
                    <h3 className="font-semibold text-blue-900 mb-2">
                      Continue building this page
                    </h3>
                    <p className="text-blue-700 text-sm">{suggestedPrompt}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild>
                  <Link to="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Homepage
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/contact">Contact Support</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
