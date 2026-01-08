import { redirect } from "next/navigation";

// Redirect /pl/[slug] to /p/[slug] for backwards compatibility
export default function PLRedirect({ params }: { params: { slug: string } }) {
  redirect(`/p/${params.slug}`);
}


