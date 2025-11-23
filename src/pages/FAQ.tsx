import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export default function FAQ() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    const { data, error } = await supabase
      .from("faqs")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setFaqs(data);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen">
      <Header />
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <HelpCircle className="h-16 w-16 text-serene-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-serene-primary">
            Preguntas Frecuentes
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Encuentra respuestas a las preguntas más comunes sobre nuestros cursos y servicios
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">Cargando preguntas...</div>
        ) : faqs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No hay preguntas frecuentes disponibles en este momento.</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={faq.id}
                  value={`item-${index}`}
                  className="bg-white rounded-lg shadow-md px-6"
                >
                  <AccordionTrigger className="text-left font-semibold">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
