import { redirect } from "next/navigation";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { getCurrentUser } from "@/lib/auth";

// LEARN (routing): This file is src/app/page.tsx, so its URL is "/".
export default async function LoginPage() {
  // If you are already logged in, go straight to the dashboard.
  // If the backend is down, still show this page, so the user sees the button.
  const user = await getCurrentUser().catch(() => null);
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-wrap">
      <section className="flex min-w-0 flex-[1_1_420px] flex-col justify-between gap-12 bg-ink p-6 text-white md:p-16">
        <div className="font-semibold">Resume Assistant</div>
        <div className="flex max-w-xl flex-col gap-8">
          <h1 className="text-4xl leading-tight font-semibold md:text-5xl">
            Turn your resume into a chat for recruiters.
          </h1>
          <ol className="flex flex-col gap-4 text-lg text-slate-200">
            <li>1. Upload your resume.</li>
            <li>2. Share your link with HR.</li>
            <li>3. HR asks questions and books an interview.</li>
          </ol>
        </div>
        <p className="font-mono text-sm text-slate-300">
          guardrail &gt; memory &gt; cache &gt; retrieve &gt; generate &gt; tools
        </p>
      </section>

      <section className="flex min-w-0 flex-[1_1_420px] items-center justify-center p-6 md:p-16">
        <div className="flex w-full max-w-md flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-semibold">Log in as a candidate</h2>
            <p className="text-muted">HR does not need this page. HR opens your shared link.</p>
          </div>

          <GoogleLoginButton />
        </div>
      </section>
    </div>
  );
}
