import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "@/app/App";

describe("Cookiesamtykke", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("viser banner ved første besøg med ligeværdige Accepter/Afvis-knapper", async () => {
    window.history.pushState({}, "", "/");
    render(<App />);
    const region = await screen.findByRole("region", { name: /Cookiesamtykke/i });
    expect(region).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Accepter alle/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Afvis alle/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tilpas/i })).toBeInTheDocument();
  });

  it("gemmer afvisning og skjuler banneret", async () => {
    window.history.pushState({}, "", "/");
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole("button", { name: /Afvis alle/i }));
    await waitFor(() => {
      expect(screen.queryByRole("region", { name: /Cookiesamtykke/i })).not.toBeInTheDocument();
    });
    const stored = JSON.parse(localStorage.getItem("autohuset:consent")!);
    expect(stored.marketing).toBe(false);
    expect(stored.statistics).toBe(false);
    // Consent Mode default er sat i dataLayer
    expect(window.dataLayer?.length).toBeGreaterThan(0);
  });
});
