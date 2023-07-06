import { useEffect, useState, useRef, useCallback } from "react";
import Detection from "./views/detection";
import Credit from "./views/credit";
import Idle from "./views/idle";

function App() {
  const [component, setComponent] = useState<"detection" | "credit" | "idle">(
    "idle"
  );

  useEffect(() => {
    // detect if user press spacebar and toggle component
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === " ") {
        setComponent((prev) => (prev === "idle" ? "detection" : "idle"));
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#F4EAFF]">
      <div>
        {component == "idle" && <Idle />}
        {component == "detection" && (
          <Detection
            onStepEnd={() =>
              setTimeout(() => {
                setComponent("idle");
              }, 5000)
            }
          />
        )}
        {component == "credit" && <Credit />}
      </div>

      <img
        src="/images/bubble-gum-man-throws-the-letter-into-the-trash.png"
        alt="trash-1"
        className="fixed bottom-4 left-0 h-auto w-96 -translate-x-10"
      />
      <img
        src="/images/bubble-gum-success.png"
        alt="trash-2"
        className="fixed bottom-4 right-0 h-auto w-96 -translate-x-10 rotate-45"
      />

      <div className="mx-auto">
        Ilustarsi dan asset yang{" "}
        <button onClick={() => setComponent("credit")}>digunakan</button>
      </div>
    </div>
  );
}

export default App;
