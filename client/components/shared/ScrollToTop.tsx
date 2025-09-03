import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      aria-label="Scroll to top"
      onClick={scrollTop}
      className={`fixed bottom-6 right-6 z-50 rounded-full shadow-lg transition-opacity ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      } bg-medical-600 hover:bg-medical-700 text-white w-12 h-12 flex items-center justify-center`}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
