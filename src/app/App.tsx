import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { queryClient } from "@/shared/api/queryClient";
import { SonnerToaster, Toaster } from "@/shared/components/ui";
import { router } from "./router";

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      {/* Dual-mount during PR3 migration; legacy Toaster is removed once
          every feature call site has moved to notify (PR3b delete gate). */}
      <Toaster />
      <SonnerToaster />
    </QueryClientProvider>
  );
}
