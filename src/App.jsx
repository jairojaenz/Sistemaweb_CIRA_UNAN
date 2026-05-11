import { AuthProvider } from "./auth/AuthContext";
import { ToastProvider } from "./components/ToastContext";
import AppRoutes from "./router/AppRoutes.jsx";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
