"use client";

import { useState, useEffect, useRef } from "react";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatSidebar from "@/components/chat/ChatSideBar";
import MessageList from "@/components/chat/MessageList";
import MessageInput from "@/components/chat/MessageInput";
import { supabase } from "@/lib/supabase/supabase-client";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { Button } from "../ui/button";
import { Menu } from "lucide-react";
import BottomNavigationBar from "../navbar/BottomNavigationBar";
import { createMessage, getChatFromId, getChatMessages, getUser } from "@/lib/supabase/utils";
import { ChatParentProps, User } from "@/lib/types";
import { ChatMessageType } from "@/lib/supabase/types";

export default function ChatParent({ userAddress, chatId, authToken }: ChatParentProps) {
  const [message, setMessage] = useState("");
  const [currentChat, setCurrentChat] = useState<ChatMessageType[]>([]);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const channelRef = useRef<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    console.log("ChatParent: Component mounted or chatId/userAddress changed");
    console.log("Current userAddress:", userAddress);
    console.log("Current chatId:", chatId);
    console.log("Supabase connection status:", supabase.getChannels().length > 0 ? "Connected" : "Disconnected");

    const initializeChat = async () => {
      await fetchChatDetails();
      await fetchMessages();
      setupRealtimeSubscription();
    };

    initializeChat();

    // Ping the channel every 30 seconds to keep the connection alive
    const intervalId = setInterval(() => {
      console.log("Pinging channel to keep connection alive");
      channelRef.current?.send({
        type: "broadcast",
        event: "ping",
        payload: {},
      });
    }, 30000);

    return () => {
      console.log("ChatParent: Component unmounting, unsubscribing from channel");
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      clearInterval(intervalId);
    };
  }, [chatId, userAddress]);

  const fetchChatDetails = async () => {
    console.log("Fetching chat details for chat ID:", chatId);
    const foundChat = await getChatFromId(chatId, authToken);

    if (!foundChat.success) {
      console.error("Error fetching chat details:", foundChat.error);
      return;
    }

    // Get the data payload from the api call response
    const data = foundChat.data;

    if (data) {
      console.log("Chat data:", data);
      console.log(data);
      const otherUserAddress = data.user_1 === userAddress ? data.user_2 : data.user_1;
      const otherUserData = await getUser(otherUserAddress, authToken);
      console.log("Determined other user address:", otherUserAddress);

      // Set the otherUser state with the address, even if we can't fetch the name
      setOtherUser({
        address: otherUserAddress,
        name: otherUserData?.data.name || otherUserAddress,
      });
    } else {
      console.log("No chat data found for chat ID:", chatId);
    }
  };

  const fetchMessages = async () => {
    console.log("Fetching messages for chat:", chatId);
    const foundMessages = await getChatMessages(chatId, true, authToken);

    if (!foundMessages.success) {
      console.error("Error fetching messages:", foundMessages.error);
    } else {
      console.log("Fetched messages:", foundMessages.data);
      setCurrentChat(foundMessages.data as ChatMessageType[]);
    }
  };

  const setupRealtimeSubscription = () => {
    console.log(`Subscribing to channel: chat:${chatId}`);
    channelRef.current = supabase
      .channel(`chat:${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload: any) => {
          console.log("Received change from Supabase:", payload);
          if (payload.eventType === "INSERT") {
            const newMessage = payload.new as ChatMessageType;
            console.log("Processed new message:", newMessage);
            if (newMessage.sender !== userAddress) {
              console.log("Updating chat with new message from other user:", newMessage);
              setCurrentChat((prevMessages) => {
                console.log("Current chat before update:", prevMessages);
                const updatedChat = [...prevMessages, newMessage];
                console.log("Updated chat after receiving new message:", updatedChat);
                return updatedChat;
              });
            } else {
              console.log("Received own message, not updating chat:", newMessage);
            }
          }
        }
      )
      .subscribe((status: string, err?: Error) => {
        if (err) {
          console.error("Subscription error:", err);
        } else {
          console.log("Subscription status:", status);
          console.log("Successfully subscribed to channel");
        }
      });
  };

  const handleSend = async (messageText: string, type?: string, requestId?: string) => {
    if (messageText.trim()) {
      console.log("Sending message:", messageText, "Type:", type, "RequestId:", requestId);
      const newMessage: ChatMessageType = {
        id: Date.now(),
        sender: userAddress,
        message: messageText.trim(),
        chat_id: chatId,
        created_at: new Date().toISOString(),
        type: type,
        requestId: requestId, // This will now be correctly stored in the database
      };

      console.log("Adding message to UI:", newMessage);
      setCurrentChat((prevMessages) => {
        console.log("Current chat before sending:", prevMessages);
        const updatedChat = [...prevMessages, newMessage];
        console.log("Updated chat after sending:", updatedChat);
        return updatedChat;
      });
      setMessage("");

      const newMessageRes = await createMessage(newMessage, authToken);

      if (!newMessageRes.success) {
        console.error("Error sending message:", newMessageRes.error);
        console.log("Reverting UI update");
        setCurrentChat((prevMessages) => prevMessages.filter((msg) => msg.id !== newMessage.id));
      } else if (newMessageRes.data) {
        console.log("Message sent successfully to Supabase:", newMessageRes.data[0]);
        setCurrentChat((prevMessages) =>
          prevMessages.map((msg) => (msg.id === newMessage.id ? newMessageRes.data[0] : msg))
        );

        if (type === "request" && requestId) {
          console.log("Request message stored with requestId:", requestId);
        }
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background lg:flex-row">
      {/* Mobile Sidebar Trigger */}
      <div className="lg:hidden p-4 border-b border-border">
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0">
            <ChatSidebar userAddress={userAddress} activeChatId={chatId} authToken={authToken} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-1/4 border-r border-border">
        <ChatSidebar userAddress={userAddress} activeChatId={chatId} authToken={authToken} />
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col p-2 pb-12">
        <ChatHeader name={otherUser?.name || "Loading..."} />
        <MessageList
          key={currentChat.length}
          messages={currentChat}
          currentUserAddress={userAddress}
          authToken={authToken}
        />
        <MessageInput
          payeeAddress={userAddress}
          payerAddress={otherUser?.address as string}
          message={message}
          setMessage={setMessage}
          handleSend={handleSend}
        />
      </div>
      <BottomNavigationBar />
    </div>
  );
}
