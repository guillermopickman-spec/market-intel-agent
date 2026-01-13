import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-card border border-border rounded-lg p-6 space-y-4 text-center">
        <h2 className="text-2xl font-bold text-foreground">404</h2>
        <p className="text-muted-foreground">This page could not be found.</p>
        <Link
          href="/"
          className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
