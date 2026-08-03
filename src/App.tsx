import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Courses from "./pages/Courses";
import MyCourses from "./pages/MyCourses";
import Projects from "./pages/Projects";
import News from "./pages/News";
import FAQ from "./pages/FAQ";
import Profile from "./pages/Profile";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import PaymentReturn from "./pages/payment/PaymentReturn";
import { Chatbot } from "./components/Chatbot";
import DashboardLayout from "./pages/dashboard/DashboardLayout";
import DashboardHome from "./pages/dashboard/DashboardHome";
import CoursesPage from "./pages/dashboard/CoursesPage";
import CourseBuilderPage from "./pages/dashboard/CourseBuilderPage";

import EnrollmentsPage from "./pages/dashboard/EnrollmentsPage";
import ProjectsPage from "./pages/dashboard/ProjectsPage";
import NewsPage from "./pages/dashboard/NewsPage";
import TeamPage from "./pages/dashboard/TeamPage";
import FaqsPage from "./pages/dashboard/FaqsPage";
import FinancePage from "./pages/dashboard/FinancePage";
import AnalyticsPage from "./pages/dashboard/AnalyticsPage";
import EmailsPage from "./pages/dashboard/EmailsPage";
import SettingsPage from "./pages/dashboard/SettingsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="courses/:id/builder" element={<CourseBuilderPage />} />

            <Route path="enrollments" element={<EnrollmentsPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="news" element={<NewsPage />} />
            <Route path="team" element={<TeamPage />} />
            <Route path="faqs" element={<FaqsPage />} />
            <Route path="finance" element={<FinancePage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="emails" element={<EmailsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="/cursos" element={<Courses />} />
          <Route path="/mis-cursos" element={<MyCourses />} />
          <Route path="/proyectos" element={<Projects />} />
          <Route path="/noticias" element={<News />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/contacto" element={<Contact />} />
          <Route path="/payment/return" element={<PaymentReturn />} />
          <Route path="/payment/success" element={<PaymentReturn />} />
          <Route path="/payment/failed" element={<PaymentReturn />} />
          <Route path="/payment/cancelled" element={<PaymentReturn />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Chatbot />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
