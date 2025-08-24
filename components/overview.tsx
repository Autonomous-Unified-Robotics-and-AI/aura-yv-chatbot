import { motion } from "framer-motion";

export const Overview = () => {
  return (
    <motion.div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="rounded-xl p-6 flex flex-col gap-4 leading-relaxed text-center max-w-xl">
        <div>
          <p className="text-lg text-muted-foreground mb-3">
            Looking to launch, grow, or fund your venture at Yale? I&apos;m your go-to AI assistant—here to help you navigate Yale&apos;s entrepreneurial ecosystem.
          </p>
        </div>
      </div>
    </motion.div>
  );
};
