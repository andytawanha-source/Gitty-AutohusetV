import { render, screen, waitFor } from "@testing-library/react";
import { App } from "@/app/App";

describe("App (demo-mode)", () => {
  it("renderer forsiden med hero og navigation", async () => {
    window.history.pushState({}, "", "/");
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Autohuset Vest/i);
    });
    expect(screen.getAllByRole("navigation").length).toBeGreaterThan(0);
    expect(await screen.findByRole("tab", { name: /Køb bil/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Sælg bil/i })).toBeInTheDocument();
    expect((await screen.findAllByText(/Model 3/i)).length).toBeGreaterThan(0);
  });
});
