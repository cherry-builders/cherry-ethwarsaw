import { X, Heart, Filter, FilterIcon, SlidersHorizontal } from "lucide-react";
import { Button } from "../ui/button";

interface ActionButtonsProps {
  onReject: () => void;
  onAccept: () => void;
  isLoading: boolean;
  onOpenFilters: () => void;
}

export default function ActionAndFiltersButtons({
  onReject,
  onAccept,
  isLoading,
  onOpenFilters,
}: ActionButtonsProps) {
  return (
    <div className="sticky bottom-0">
      <div className="absolute bottom-16 left-0 right-0 flex justify-center space-x-4">
        <button
          onClick={onReject}
          className="bg-primary text-destructive-foreground rounded-full p-4 shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          aria-label="Dislike"
          disabled={isLoading}
        >
          <X size={24} />
        </button>
        <button
          onClick={onAccept}
          className="bg-green-500 text-primary-foreground rounded-full p-4 shadow-lg hover:bg-green-500/90 transition-colors disabled:opacity-50"
          aria-label="Like"
          disabled={isLoading}
        >
          <Heart size={24} />
        </button>
      </div>
      <div className="absolute bottom-16 right-4">
        <Button
          onClick={onOpenFilters}
          className="flex justify-end items-center  rounded-xl my-2 py-1.5 px-2 bg-secondary"
          aria-label="Open Filters"
        >
          <Filter className="mr-0 h-5 w-5" />
          {/* Filters */}
        </Button>
      </div>
    </div>
  );
}
