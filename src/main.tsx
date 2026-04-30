import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import ControlPanel from "./pages/ControlPanel";
import Overlay from "./pages/Overlay";
import { musicListener } from "./lib/musicListener";
musicListener.start();
import Settings from "./components/Settings";

<Settings />
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ControlPanel />} />
        <Route path="/overlay" element={<Overlay />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
