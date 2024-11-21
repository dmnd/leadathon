import { redirect } from "next/navigation";

export default function DefaultPage() {
  // TODO: store campus in cookie then auto-redirect to it
  redirect("/car");
}
