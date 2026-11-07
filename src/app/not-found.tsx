import Link from "next/link";

// LEARN (special file): notFound() shows this page.
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="text-muted">This link may be wrong. Please ask the candidate for the correct link.</p>
      <Link href="/" className="text-accent underline">
        Go to home
      </Link>
    </main>
  );
}
