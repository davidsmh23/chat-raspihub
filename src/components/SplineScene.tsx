import { lazy, Suspense } from "react";

const Spline = lazy(() => import("@splinetool/react-spline"));

export function SplineScene() {
  return (
    <div
      style={{
        width: 400,
        height: 400,
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      <Suspense
        fallback={
          <div
            style={{
              width: 400,
              height: 400,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "0.65rem",
                color: "rgba(201,168,76,0.3)",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              Cargando escena...
            </span>
          </div>
        }
      >
        <Spline
          scene="https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode"
          style={{ width: 400, height: 400, pointerEvents: "none" }}
        />
      </Suspense>
    </div>
  );
}
