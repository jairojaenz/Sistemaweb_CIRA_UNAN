import { AuthProvider } from "./auth/AuthContext";
import { ToastProvider } from "./components/ToastContext";
import { ThemeProvider } from "./theme/ThemeContext.jsx";
import AppRoutes from "./router/AppRoutes.jsx";
import "./App.css";

function App() {
  // ThemeProvider activa el modo claro/oscuro en toda la app (clase `dark` en <html>).
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
