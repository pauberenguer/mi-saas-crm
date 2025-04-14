// src/app/chat/page.tsx
import Layout from '@/components/Layout';
import Chat from '@/components/Chat';

export default function ChatPage() {
  // Usaremos un contactId fijo por ahora (ej. 'contacto-1')
  const contactId = 'contacto-1';

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Chat</h1>
      <p className="mb-4">Conversación con: {contactId}</p>
      <Chat contactId={contactId} />
    </Layout>
  );
}