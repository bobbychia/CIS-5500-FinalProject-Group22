import { Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage.jsx";
import MainSearchPage from "./pages/MainSearchPage.jsx";
import RecommendedSearchPage from "./pages/RecommendedSearchPage.jsx";
import RankingsPage from "./pages/RankingsPage.jsx";
import ZipDetailPage from "./pages/ZipDetailPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/find" element={<MainSearchPage />} />
      <Route path="/quick" element={<RecommendedSearchPage />} />
      <Route path="/rank" element={<RankingsPage />} />
      <Route path="/recommended" element={<RecommendedSearchPage />} />
      <Route path="/rankings" element={<RankingsPage />} />
      <Route path="/zip/:zipCode" element={<ZipDetailPage />} />
    </Routes>
  );
}
