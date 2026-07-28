import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "@/app/App";

describe("Adminpanel (demo-mode)", () => {
  it("kræver login og accepterer demo-login", async () => {
    window.history.pushState({}, "", "/admin");
    const user = userEvent.setup();
    render(<App />);

    // Uautentificeret → login-side
    expect(await screen.findByLabelText(/E-mail/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/E-mail/i), "demo@demo.dk");
    await user.type(screen.getByLabelText(/Adgangskode/i), "demo1234");
    await user.click(screen.getByRole("button", { name: /Log ind/i }));

    // Dashboard med nøgletal
    expect(await screen.findByRole("heading", { name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.getByText(/Aktive biler/i)).toBeInTheDocument();
    expect(screen.getByText(/Nye leads/i)).toBeInTheDocument();
    // Demo-banner
    expect(screen.getByText(/DEMO-MODE/i)).toBeInTheDocument();
  }, 15000);
});
