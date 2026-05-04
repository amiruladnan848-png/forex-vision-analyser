import { motion } from "framer-motion";
import ownerImg from "@/assets/owner.jpg";

/**
 * Subtle full-page background featuring owner photo with heavy
 * gradient overlay so foreground content stays readable.
 */
const OwnerBackdrop = () => {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${ownerImg})` }}
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.18 }}
        transition={{ duration: 2 }}
      />
      {/* Dark gradient overlays for legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/85 to-background/95" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80" />
      {/* Animated neon glow accents */}
      <motion.div
        className="absolute -top-20 -left-20 w-96 h-96 rounded-full"
        style={{ background: "radial-gradient(circle, hsl(175 100% 45% / 0.15), transparent 70%)" }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ repeat: Infinity, duration: 8 }}
      />
      <motion.div
        className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full"
        style={{ background: "radial-gradient(circle, hsl(145 80% 45% / 0.12), transparent 70%)" }}
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.6, 0.4, 0.6] }}
        transition={{ repeat: Infinity, duration: 10 }}
      />
    </div>
  );
};

export default OwnerBackdrop;
