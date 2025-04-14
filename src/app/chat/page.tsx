// src/app/chat/page.tsx
import { redirect } from "next/navigation";

export default function ChatIndex() {
  // Redirige a la conversación por defecto (por ejemplo, "6")
  redirect("/chat/6");
}