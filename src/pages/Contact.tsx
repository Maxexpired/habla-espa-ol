import { useState } from "react";
import { Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";

const contactSchema = z.object({
  name: z.string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  email: z.string()
    .trim()
    .email("Email inválido")
    .max(255, "El email no puede exceder 255 caracteres"),
  phone: z.string()
    .trim()
    .min(8, "El teléfono debe tener al menos 8 caracteres")
    .max(20, "El teléfono no puede exceder 20 caracteres")
    .regex(/^[+\d\s()-]+$/, "Solo números, espacios y símbolos + - ( ) permitidos"),
  message: z.string()
    .trim()
    .min(10, "El mensaje debe tener al menos 10 caracteres")
    .max(1000, "El mensaje no puede exceder 1000 caracteres"),
});

const Contact = () => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const validation = contactSchema.safeParse({
        name,
        email,
        phone,
        message,
      });

      if (!validation.success) {
        toast({
          title: "Error de validación",
          description: validation.error.errors[0].message,
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      // Aquí puedes agregar la lógica para enviar el formulario
      // Por ejemplo, enviar a una función de edge o guardar en la base de datos
      
      toast({
        title: "Mensaje enviado",
        description: "Gracias por contactarnos. Te responderemos pronto.",
      });

      // Limpiar formulario
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Hubo un problema al enviar el mensaje. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen gradient-soft">
      <Header />
      <Navbar />
      
      {/* Hero Section */}
      <section className="gradient-hero text-white py-12 sm:py-16 md:py-20 relative overflow-hidden border-b border-serene-accent/20">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <Badge variant="secondary" className="mb-4 text-serene-accent border-serene-accent/30">
              Contáctanos
            </Badge>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold mb-4 sm:mb-6 text-gradient">
              Hablemos de tu Proyecto
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 leading-relaxed">
              Estamos aquí para ayudarte a transformar tus ideas en realidad. 
              Ponte en contacto con nuestro equipo.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12 sm:py-16 md:py-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-serene-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-serene-accent-light/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 max-w-6xl mx-auto">
            {/* Contact Form */}
            <Card className="card-hover border-0 shadow-elegant backdrop-blur-sm gradient-card">
              <CardContent className="p-5 sm:p-6 md:p-8">
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-6">
                  Envíanos un Mensaje
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2 text-foreground">
                      Nombre Completo
                    </label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Tu nombre"
                      className="w-full"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2 text-foreground">
                      Correo Electrónico
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      className="w-full"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      maxLength={255}
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium mb-2 text-foreground">
                      Teléfono
                    </label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 234 567 890"
                      className="w-full"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      maxLength={20}
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-2 text-foreground">
                      Mensaje
                    </label>
                    <Textarea
                      id="message"
                      placeholder="Cuéntanos cómo podemos ayudarte..."
                      className="w-full min-h-32"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      maxLength={1000}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {message.length}/1000 caracteres
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full button-hover"
                    size="lg"
                    disabled={submitting}
                  >
                    {submitting ? "Enviando..." : "Enviar Mensaje"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <div className="space-y-8">
              <div className="animate-fade-in-up">
                <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                  Información de Contacto
                </h3>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  Ponte en contacto con nosotros a través de cualquiera de estos medios.
                  Estaremos encantados de responder tus preguntas.
                </p>
              </div>

              <div className="space-y-6">
                <Card className="card-hover border-0 gradient-card backdrop-blur-sm glow-border">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-serene-accent p-3 rounded-xl flex-shrink-0 shadow-glow">
                        <Mail className="h-6 w-6 text-serene-dark drop-shadow-lg" strokeWidth={2.5} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-1 text-lg">Email</h4>
                        <p className="text-muted-foreground">contacto@serene.com</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-hover border-0 gradient-card backdrop-blur-sm glow-border">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-serene-accent p-3 rounded-xl flex-shrink-0 shadow-glow">
                        <Phone className="h-6 w-6 text-serene-dark drop-shadow-lg" strokeWidth={2.5} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-1 text-lg">Teléfono</h4>
                        <p className="text-muted-foreground">+1 (555) 123-4567</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-hover border-0 gradient-card backdrop-blur-sm glow-border">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-serene-accent p-3 rounded-xl flex-shrink-0 shadow-glow">
                        <MapPin className="h-6 w-6 text-serene-dark drop-shadow-lg" strokeWidth={2.5} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-1 text-lg">Dirección</h4>
                        <p className="text-muted-foreground">
                          123 Tech Street<br />
                          Ciudad Innovación, CI 12345
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
