import { Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage.jsx";
import MainSearchPage from "./pages/MainSearchPage.jsx";
import RecommendedSearchPage from "./pages/RecommendedSearchPage.jsx";
import RankingsPage from "./pages/RankingsPage.jsx";
import ZipDetailPage from "./pages/ZipDetailPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";

function protectedPage(page) {
  return <ProtectedRoute>{page}</ProtectedRoute>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/find" element={protectedPage(<MainSearchPage />)} />
      <Route path="/quick" element={protectedPage(<RecommendedSearchPage />)} />
      <Route path="/rank" element={protectedPage(<RankingsPage />)} />
      <Route path="/recommended" element={protectedPage(<RecommendedSearchPage />)} />
      <Route path="/rankings" element={protectedPage(<RankingsPage />)} />
      <Route path="/zip/:zipCode" element={protectedPage(<ZipDetailPage />)} />
    </Routes>
  );
}
