import { redirect } from "next/navigation";

// Players land on the quiz directly (the projector QR also points there). No polling landing page.
export default function Home() {
  redirect("/quiz");
}
