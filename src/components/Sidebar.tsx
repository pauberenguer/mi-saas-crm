// src/components/Sidebar.tsx
import Link from 'next/link';

const Sidebar = () => {
  return (
    <aside className="w-64 h-screen bg-gray-200 p-4">
      <nav>
        <ul>
          <li className="mb-4">
            <Link href="/contactos">Contactos</Link>
          </li>
          <li className="mb-4">
            <Link href="/automatizaciones">Automatizaciones</Link>
          </li>
          <li>
            <Link href="/chat">Chat</Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;