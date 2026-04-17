import { Route, Routes } from "react-router-dom";
import MainSearchPage from "./pages/MainSearchPage.jsx";
import RecommendedSearchPage from "./pages/RecommendedSearchPage.jsx";
import ZipDetailPage from "./pages/ZipDetailPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainSearchPage />} />
      <Route path="/recommended" element={<RecommendedSearchPage />} />
      <Route path="/zip/:zipCode" element={<ZipDetailPage />} />
    </Routes>
  );
}
