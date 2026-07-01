import { Suspense, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { Spinner } from "@/shared/components/ui";
import { useActiveSemester } from "@/shared/api/semestersApi";
import { useUiStore } from "@/shared/stores/uiStore";

/**
 * Authenticated application frame: sticky frosted TopBar above a fixed Sidebar
 * and a scrolling content column rendered through the router Outlet. Also keeps
 * the selected semester in sync with the active one resolved from the backend.
 */
export function AppShell() {
  useSyncActiveSemester();

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <TopBar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="relative flex-1 overflow-x-hidden">
          {/* Clean neutral canvas. The spectrum glow is reserved for accent
              surfaces (the Home hero card, the login backdrop), never the
              full-page background — that ambient wash is what made every page
              look noisy. */}
          <div className="relative mx-auto w-full max-w-[1100px] px-10 py-12">
            <Suspense
              fallback={
                <div className="flex justify-center py-24">
                  <Spinner />
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}

/** Mirror the active semester id into the UI store so pages query the right one. */
function useSyncActiveSemester() {
  const semester = useActiveSemester();
  const setSelectedSemesterId = useUiStore((s) => s.setSelectedSemesterId);

  useEffect(() => {
    if (semester) setSelectedSemesterId(semester.id);
  }, [semester, setSelectedSemesterId]);
}
