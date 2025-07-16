import { motion } from "framer-motion";
import Link from "next/link";

import { YaleVenturesIcon } from "./icons";

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
      <div className="rounded-xl p-6 flex flex-col gap-8 leading-relaxed text-center max-w-xl">
        <div className="flex flex-row justify-center items-center">
          <YaleVenturesIcon size={64} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-primary mb-4">Welcome to Yale Ventures</h1>
          <p className="text-lg text-muted-foreground mb-6">
            Your AI-powered assistant for startup guidance and entrepreneurial support
          </p>
        </div>
        <p className="text-base">
          I'm here to help you navigate the entrepreneurial landscape with insights from{" "}
          <Link
            className="font-medium underline underline-offset-4 text-primary"
            href="https://ventures.yale.edu"
            target="_blank"
          >
            Yale Ventures
          </Link>
          . Whether you're looking for funding opportunities, startup resources, or strategic guidance, 
          I can provide personalized recommendations based on your needs and goals.
        </p>
        <p className="text-sm text-muted-foreground">
          Start by asking me about funding opportunities, startup programs, or any entrepreneurial questions you have.
        </p>
      </div>
    </motion.div>
  );
};
