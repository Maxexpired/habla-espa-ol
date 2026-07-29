import { Navigate } from "react-router-dom";

// Legacy route target: redirect to the new dashboard shell.
export default function Dashboard() {
  return <Navigate to="/dashboard" replace />;
}
