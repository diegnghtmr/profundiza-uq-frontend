import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock the data layer so the page renders without a QueryClient/network.
// SettingsPage and its edit dialog consume every hook in this module.
vi.mock("@/features/admin-settings/api/settingsApi", () => ({
  useSettings: vi.fn(),
  useUpdateSetting: vi.fn(),
  MIN_REASON_LENGTH: 3,
}));

import {
  useSettings,
  useUpdateSetting,
  type GlobalSetting,
} from "@/features/admin-settings/api/settingsApi";
import { SettingsPage } from "@/features/admin-settings/pages/SettingsPage";

const mockUseSettings = vi.mocked(useSettings);

function setting(overrides: Partial<GlobalSetting>): GlobalSetting {
  return {
    key: "enrollment.window_open",
    value: true,
    description: "Whether the enrollment window is currently open.",
    updatedByAdminUserId: null,
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function asSettingsQuery(data: GlobalSetting[] | undefined, isLoading = false) {
  return { data, isLoading, isError: false } as unknown as ReturnType<
    typeof useSettings
  >;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useUpdateSetting).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useUpdateSetting>);
});

describe("SettingsPage", () => {
  it("renders the heading and a setting key row", () => {
    mockUseSettings.mockReturnValue(
      asSettingsQuery([
        setting({ key: "enrollment.window_open", value: true }),
        setting({
          key: "enrollment.max_electives",
          value: 4,
          description: "Maximum electives a student may select.",
        }),
      ]),
    );

    render(<SettingsPage />);

    expect(
      screen.getByRole("heading", { name: "Settings", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText("enrollment.window_open")).toBeInTheDocument();
    expect(screen.getByText("enrollment.max_electives")).toBeInTheDocument();
  });

  it("shows an empty state when no settings are configured", () => {
    mockUseSettings.mockReturnValue(asSettingsQuery([]));

    render(<SettingsPage />);

    expect(
      screen.getByText("No global settings are configured yet."),
    ).toBeInTheDocument();
  });

  it("toggles a boolean setting's Value with the Switch and saves it (FR-005)", async () => {
    const user = userEvent.setup();
    const mutate = vi.fn();
    vi.mocked(useUpdateSetting).mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateSetting>);
    mockUseSettings.mockReturnValue(
      asSettingsQuery([
        setting({ key: "enrollment.window_open", value: true }),
      ]),
    );

    render(<SettingsPage />);

    await user.click(screen.getByRole("button", { name: "Edit" }));

    const toggle = screen.getByRole("switch", { name: "Value" });
    expect(toggle).toHaveAttribute("aria-checked", "true");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "false");

    await user.type(screen.getByLabelText("Reason"), "Closing early");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        key: "enrollment.window_open",
        value: false,
        reason: "Closing early",
      }),
      expect.anything(),
    );
  });
});
