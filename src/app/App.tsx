import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { queryClient } from "@/shared/api/queryClient";
import { SonnerToaster } from "@/shared/components/ui";
import { AppErrorBoundary } from "./AppErrorBoundary";
import { router } from "./router";

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppErrorBoundary>
        <RouterProvider router={router} />
      </AppErrorBoundary>
      <SonnerToaster />
    </QueryClientProvider>
  );
}
