"use client";
import ContactList from "@/components/ContactList";

const ChatLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen">
      <div className="w-1/4">
        <ContactList />
      </div>
      <div className="flex-1 p-4">
        {children}
      </div>
    </div>
  );
};

export default ChatLayout;