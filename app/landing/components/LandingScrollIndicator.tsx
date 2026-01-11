"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

export default function LandingScrollIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1 }}
      className="absolute bottom-6 left-1/2 -translate-x-1/2"
    >
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="flex flex-col items-center gap-2 text-white/30"
      >
        <span className="text-xs">Scroll to explore</span>
        <ChevronDown className="w-4 h-4" />
      </motion.div>
    </motion.div>
  );
}


