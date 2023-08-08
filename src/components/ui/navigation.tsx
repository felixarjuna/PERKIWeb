import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";

interface NavigationProps {
  showNav: boolean;
}

export default function Navigation({ showNav }: NavigationProps) {
  return (
    <AnimatePresence>
      {showNav ? (
        <motion.div
          key="navigation"
          initial={{ opacity: 0 }}
          animate={{
            y: [0, 20, 0],
            opacity: 1,
            transition: {
              y: { ease: [0.6, 0.01, -0.05, 0.95], duration: 0.8 },
            },
          }}
          exit={{ opacity: 0, y: [0, 20, 0], transition: { duration: 0.5 } }}
          className="fixed isolate top-10 left-0 right-0 mx-auto bg-green-default/40 w-fit h-fit text-cream-default text-xl px-8 py-4 rounded-lg flex gap-6 z-50"
        >
          <Link to="/" className="font-reimbrandt text-2xl">
            Perki Aachen
          </Link>
          <Link to="/prayers" className="flex gap-2 cursor-pointer items-center">
            <span className="bg-gradient-to-r from-light-green-default/50 to-green-default rounded-lg p-[2px]">
              🙏
            </span>
            <p>Let's pray together</p>
          </Link>
          <Link to="/schedule" className="flex gap-2 cursor-pointer items-center">
            <span className="bg-gradient-to-r from-light-green-default/50 to-green-default rounded-lg p-[2px]">
              📅
            </span>
            <p>Schedule</p>
          </Link>
          <Link to="/takeaway" className="flex gap-2 cursor-pointer items-center">
            <span className="bg-gradient-to-r from-light-green-default/50 to-green-default rounded-lg p-[2px]">
              🧠
            </span>
            <p>Takeaways</p>
          </Link>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
