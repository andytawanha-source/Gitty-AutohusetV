import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "@/app/App";

describe("Salgsvurdering (demo-mode)", () => {
  it("gennemfører trin 1 og 2 med mock-provider", async () => {
    window.history.pushState({}, "", "/saelg-din-bil");
    const user = userEvent.setup();
    render(<App />);

    // Trin 1: nummerplade + km
    const plateInput = await screen.findByLabelText(/Nummerplade/i);
    await user.type(plateInput, "AB12345");
    await user.type(screen.getByLabelText(/Kilometerstand/i), "85000");
    await user.click(screen.getByRole("button", { name: /Find min bil/i }));

    // Trin 2: bekræft bil (mockdata markeret som demo)
    await waitFor(
      () => {
        expect(screen.getByText(/Er dette din bil/i)).toBeInTheDocument();
      },
      { timeout: 4000 }
    );
    expect(screen.getByText(/DEMO-MODE/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ja, det er min bil/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /indtast oplysninger manuelt/i })).toBeInTheDocument();

    // Videre til trin 3
    await user.click(screen.getByRole("button", { name: /Ja, det er min bil/i }));
    expect(await screen.findByText(/Bilens stand/i)).toBeInTheDocument();
  }, 15000);
});
