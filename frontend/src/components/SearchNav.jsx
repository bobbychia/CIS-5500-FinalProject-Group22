import { TabMenu } from "primereact/tabmenu";
import { useLocation, useNavigate } from "react-router-dom";

export default function SearchNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeIndex = location.pathname.startsWith("/recommended") ? 1 : 0;

  const items = [
    { label: "Flexible search", icon: "pi pi-sliders-h" },
    { label: "Recommended searches", icon: "pi pi-star" },
  ];

  return (
    <TabMenu
      model={items}
      activeIndex={activeIndex}
      onTabChange={(e) => (e.index === 0 ? navigate("/") : navigate("/recommended"))}
      className="search-tabmenu"
    />
  );
}
