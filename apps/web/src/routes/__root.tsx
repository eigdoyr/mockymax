import { Outlet, createRootRoute, Link } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-200 bg-white">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-lg font-bold tracking-tight">
            MockyMax
          </Link>
          <div className="flex gap-6 text-sm">
            <Link
              to="/"
              activeProps={{ className: "text-neutral-900" }}
              className="text-neutral-600 hover:text-neutral-900"
            >
              Gallery
            </Link>
            <Link
              to="/editor"
              activeProps={{ className: "text-neutral-900" }}
              className="text-neutral-600 hover:text-neutral-900"
            >
              Editor
            </Link>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-12">
        <Outlet />
      </main>
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </div>
  );
}
