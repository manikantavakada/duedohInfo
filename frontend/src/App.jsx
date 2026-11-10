import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Apply from "./pages/Apply.jsx";
import Status from "./pages/Status.jsx";
import NotFound from "./pages/NotFound.jsx";
import IntroVideo from "./components/IntroVideo.jsx";

export default function App() {
  return <>
    <IntroVideo />
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/apply" element={<Apply />} />
      <Route path="/status" element={<Status />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </>;
}
