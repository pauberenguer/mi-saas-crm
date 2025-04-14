"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';

const Chat = ({ contactId }: { contactId: string }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  // Función para obtener los mensajes iniciales
  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      setMessages(data || []);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Usando la API de canales de Supabase v2 para suscribirse a cambios
    const channel = supabase.channel('messages-channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `contact_id=eq.${contactId}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();

    // Limpieza de la suscripción: remover el canal cuando se desmonte el componente
    return () => {
      supabase.removeChannel(channel);
    };
  }, [contactId]);

  // Función para enviar un mensaje y disparar el webhook de n8n
  const sendMessage = async () => {
    if (newMessage.trim().length === 0) return;

    const { error } = await supabase.from('messages').insert([
      {
        contact_id: contactId,
        content: newMessage,
      },
    ]);

    if (error) {
      console.error('Error sending message:', error);
    } else {
      // Llamar al webhook de n8n usando la URL que me proporcionaste
      fetch('https://n8n.asisttente.com/webhook/elglobobot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contact_id: contactId,
          content: newMessage,
          timestamp: new Date(),
        }),
      }).catch((err) => console.error('Error calling n8n webhook:', err));

      setNewMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Panel de Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 border rounded mb-4">
        {messages.map((msg) => (
          <div key={msg.id} className="p-2 border-b">
            {msg.content}
          </div>
        ))}
      </div>
      {/* Entrada de Mensaje */}
      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 p-2 border rounded"
          placeholder="Escribe un mensaje..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
        />
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded"
          onClick={sendMessage}
        >
          Enviar
        </button>
      </div>
    </div>
  );
};

export default Chat;