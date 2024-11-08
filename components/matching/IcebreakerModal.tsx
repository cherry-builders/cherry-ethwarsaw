import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserType } from "@/lib/supabase/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface IcebreakerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (message: string) => void;
  user: UserType;
}

export default function IcebreakerModal({ isOpen, onClose, onSend, user }: IcebreakerModalProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    onSend(message);
    setMessage("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Send an Icebreaker</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4 py-4">
          <Avatar className="w-20 h-20">
            <AvatarImage src={user?.profile_pictures?.[0]} alt={user?.name} />
            <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
          </Avatar>
          
          <p className="text-lg font-medium">{user?.name}</p>
          
          <p className="text-sm text-muted-foreground text-center px-4">
            {user?.name} will receive an email notification with your message
          </p>

          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write a friendly message to break the ice..."
            className="min-h-[100px]"
            maxLength={300}
          />
          
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={!message.trim()}
              className="flex-1"
            >
              Send Message
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 