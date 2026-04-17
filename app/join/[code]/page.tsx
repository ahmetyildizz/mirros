import { redirect } from "next/navigation";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const clean    = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);

  if (!clean) redirect("/");
  redirect(`/?code=${clean}`);
}
