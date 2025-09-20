import { useState, useRef, KeyboardEvent, ChangeEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/registry/default/lib/utils";

interface InputTagProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

function InputTag({
  value = [],
  onChange,
  placeholder = "输入标签...",
  className,
  disabled,
}: InputTagProps) {
  const [inputValue, setInputValue] = useState("");
  const [tags, setTags] = useState<string[]>(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = () => {
    if (inputValue.trim() && !tags.includes(inputValue.trim())) {
      const newTags = [...tags, inputValue.trim()];
      setTags(newTags);
      onChange?.(newTags);
      setInputValue("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    onChange?.(newTags);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
      // Remove the last tag when backspace is pressed and input is empty
      const lastTag = tags[tags.length - 1];
      removeTag(lastTag);
    }
  };

  const handleInputBlur = () => {
    if (inputValue.trim()) {
      addTag();
    }
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-md border border-input bg-background p-2 shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      {tags.map(tag => (
        <div
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs font-medium"
        >
          <span>{tag}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => removeTag(tag)}
            disabled={disabled}
          >
            <X className="size-3" />
            <span className="sr-only">移除标签</span>
          </Button>
        </div>
      ))}
      <Input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        onBlur={handleInputBlur}
        placeholder={tags.length === 0 ? placeholder : ""}
        className="h-6 w-full min-w-[100px] border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
        disabled={disabled}
      />
    </div>
  );
}

export { InputTag };
