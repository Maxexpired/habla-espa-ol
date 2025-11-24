import { useState } from "react";
import { Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

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

export const ContactSection = () => {
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
    <section id="contacto" className="py-12 sm:py-16 md:py-20 gradient-subtle">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-foreground mb-3 sm:mb-4">
            Contáctanos
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Estamos aquí para ayudarte. Envíanos un mensaje
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 max-w-6xl mx-auto">
          {/* Contact Form */}
          <Card className="border-0 shadow-xl">
            <CardContent className="p-5 sm:p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
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
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
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
                  <label htmlFor="phone" className="block text-sm font-medium mb-2">
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
                  <label htmlFor="message" className="block text-sm font-medium mb-2">
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
                  className="w-full bg-serene-secondary hover:bg-serene-primary text-white"
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
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-6">
                Información de Contacto
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-8">
                Ponte en contacto con nosotros a través de cualquiera de estos medios.
                Estaremos encantados de responder tus preguntas.
              </p>
            </div>

            <div className="space-y-6">
              <Card className="border-l-4 border-l-serene-accent border-t-0 border-r-0 border-b-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-serene-secondary/10 p-3 rounded-lg">
                      <Mail className="h-6 w-6 text-serene-accent" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Email</h4>
                      <p className="text-muted-foreground">contacto@serene.com</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-serene-accent border-t-0 border-r-0 border-b-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-serene-secondary/10 p-3 rounded-lg">
                      <Phone className="h-6 w-6 text-serene-accent" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Teléfono</h4>
                      <p className="text-muted-foreground">+1 (555) 123-4567</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-serene-accent border-t-0 border-r-0 border-b-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-serene-secondary/10 p-3 rounded-lg">
                      <MapPin className="h-6 w-6 text-serene-accent" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Dirección</h4>
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
  );
};
