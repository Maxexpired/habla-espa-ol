import { Header } from "@/components/Header";
import { Navbar } from "@/components/Navbar";
import { CoursesSection } from "@/components/sections/CoursesSection";
import { ProjectsSection } from "@/components/sections/ProjectsSection";
import { NewsSection } from "@/components/sections/NewsSection";
import { MissionSection } from "@/components/sections/MissionSection";
import { TeamSection } from "@/components/sections/TeamSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <Navbar />
      <main>
        <CoursesSection />
        <ProjectsSection />
        <NewsSection />
        <MissionSection />
        <TeamSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
