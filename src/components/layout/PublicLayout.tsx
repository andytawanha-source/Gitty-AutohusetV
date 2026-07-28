import { Outlet } from "react-router-dom";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { SkipLink } from "./SkipLink";

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <SkipLink />
      <SiteHeader />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
