import "./index.css";
import { Form } from "./components/ui/form";
import { Interview } from "./components/ui/Interview";
import { Result } from "./components/ui/Result";
import { Toaster } from "sonner";
import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router";

export function App() {
  const [page, setPage] = useState<"form" | "interview" | "result">("form");

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Form />} />
        <Route path="/interview/:interviewId" element={<Interview />} />
        <Route path="/result/:interviewId" element={<Result />} />
      </Routes>
      <Toaster position="bottom-left" />
    </BrowserRouter>
  );
}

export default App;