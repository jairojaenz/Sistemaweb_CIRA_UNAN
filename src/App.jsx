import { AuthProvider } from "./auth/AuthContext";
import AppRoutes from "./router/AppRoutes.jsx";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
