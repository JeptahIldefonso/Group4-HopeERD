"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, Box, CornerDownLeft } from "lucide-react";
import { Modal, ModalContent } from "@/components/ui/modal";

interface SearchItem {
  id: string;
  title: string;
  type: string;
  slug: string;
  href: string;
}

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items?: SearchItem[];
}

export function CommandMenu({ open, onOpenChange, items = [] }: CommandMenuProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const filtered = query
    ? items.filter(
        (i) =>
          i.title.toLowerCase().includes(query.toLowerCase()) ||
          i.type.toLowerCase().includes(query.toLowerCase())
      )
    : items.slice(0, 8);

  const handleSelect = (href: string) => {
    onOpenChange(false);
    setQuery("");
    router.push(href);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-lg p-0 overflow-hidden" title="Command Palette">
        <div className="flex items-center border-b border-border px-3 bg-bg">
          <Search className="h-4 w-4 text-fg-subtle mr-2 stroke-[1.5]" />
          <input
            type="text"
            placeholder="Search docs, applications, theory, syllabi..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent py-3 text-xs font-mono text-fg focus:outline-none placeholder:text-fg-subtle"
            autoFocus
          />
        </div>

        <div className="max-h-72 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-fg-subtle">
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.href)}
                  className="w-full flex items-center justify-between p-2.5 rounded-[2px] text-left hover:bg-bg-hover transition-colors group cursor-pointer"
                >
                  <div className="flex items-center space-x-2.5">
                    {item.type === "app" ? (
                      <Box className="w-3.5 h-3.5 text-fg-subtle stroke-[1.5] group-hover:text-fg" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-fg-subtle stroke-[1.5] group-hover:text-fg" />
                    )}
                    <span className="font-mono text-xs text-fg group-hover:font-medium">
                      {item.title}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-fg-subtle bg-bg-raised border border-border px-1.5 py-0.5 rounded-[2px]">
                      {item.type}
                    </span>
                    <CornerDownLeft className="w-3 h-3 text-fg-subtle opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border px-4 py-2 bg-bg flex items-center justify-between text-[10px] font-mono text-fg-subtle">
          <span>Navigate with mouse or arrow keys</span>
          <span>ESC to close</span>
        </div>
      </ModalContent>
    </Modal>
  );
}
