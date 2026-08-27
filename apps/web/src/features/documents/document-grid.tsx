"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Category, DocumentRecord } from "@lockkaro/types";
import { DocumentCard } from "./document-card";

interface Props {
  documents: DocumentRecord[];
  categoryMap: Map<string, Category>;
}

// Deliberately quick + subtle. Reduced-motion users get an instant swap
// because Framer Motion respects `prefers-reduced-motion` by default.
const item = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.18 } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

export function DocumentGrid({ documents, categoryMap }: Props) {
  return (
    <motion.div
      layout
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {documents.map((d, i) => (
          <motion.div
            key={d.id}
            layout
            variants={item}
            initial="hidden"
            animate="show"
            exit="exit"
            transition={{ delay: Math.min(i, 6) * 0.02 }}
          >
            <DocumentCard
              document={d}
              category={d.categoryId ? categoryMap.get(d.categoryId) : undefined}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
