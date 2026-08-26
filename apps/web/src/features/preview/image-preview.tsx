"use client";

import { Maximize2, Minus, Plus, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  url: string;
  alt: string;
  onOpenFullscreen?: () => void;
}

export function ImagePreview({ url, alt, onOpenFullscreen }: Props) {
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const startRef = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  const zoom = (delta: number) =>
    setScale((s) => Math.min(4, Math.max(0.5, s + delta)));

  const reset = useCallback(() => {
    setScale(1);
    setPos({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    reset();
  }, [url, reset]);

  const onMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setDragging(true);
    startRef.current = {
      mx: e.clientX,
      my: e.clientY,
      px: pos.x,
      py: pos.y,
    };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setPos({
      x: startRef.current.px + (e.clientX - startRef.current.mx),
      y: startRef.current.py + (e.clientY - startRef.current.my),
    });
  };
  const stop = () => setDragging(false);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-md bg-muted">
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stop}
        onMouseLeave={stop}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={alt}
          draggable={false}
          onDoubleClick={() => (scale > 1 ? reset() : setScale(2))}
          className={cn(
            "select-none transition-transform duration-150 ease-out",
            scale > 1
              ? dragging
                ? "cursor-grabbing"
                : "cursor-grab"
              : "cursor-zoom-in",
          )}
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
            maxHeight: "100%",
            maxWidth: "100%",
          }}
        />
      </div>

      <div className="pointer-events-auto absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-background/90 p-1 shadow-elevated backdrop-blur">
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => zoom(-0.25)}
          aria-label="Zoom out"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="min-w-[3rem] text-center font-mono text-xs text-muted-foreground">
          {Math.round(scale * 100)}%
        </span>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => zoom(0.25)}
          aria-label="Zoom in"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={reset}
          aria-label="Reset zoom"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        {onOpenFullscreen && (
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={onOpenFullscreen}
            aria-label="Full screen"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
