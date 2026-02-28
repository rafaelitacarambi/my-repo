import { useRouteError } from "react-router";
import { useEffect, useRef } from "react";
import { ErrorOverlay } from "../../vite-error-overlay-plugin";

export default function ErrorPage() {
  const ref = useRef<HTMLDivElement>(null);
  const error = useRouteError() as Error;

  return (
    <div className="p-8 bg-red-50 text-red-900 overflow-auto max-h-screen">
      <h2 className="text-2xl font-bold mb-4">Application Error</h2>
      <p className="font-semibold mb-2">{error.message}</p>
      <pre className="text-sm bg-red-100 p-4 rounded overflow-x-auto">
        {error.stack}
      </pre>
    </div>
  );
};
