import { Instagram, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="flex justify-between px-44 py-20 bg-dark-green-default text-light-green-default xs:px-10 xs:flex-col xs:gap-4 xs:py-10">
      <div className="flex gap-4 items-center text-2xl xs:text-sm">
        <Mail className="w-6 h-6 xs:w-4 xs:h-4" />
        <a href="mailto:mita@perki-aachen.com">mita@perki-aachen.com</a>
      </div>
      <div className="flex gap-4 items-center text-2xl xs:text-sm">
        <Phone className="w-6 h-6 xs:w-4 xs:h-4" />
        <a href="tel:+49 17637503305">+49 1745277265</a>
      </div>
      <div className="flex gap-4 items-center text-2xl xs:text-sm">
        <Instagram className="w-6 h-6 xs:w-4 xs:h-4" />
        <Link to="https://www.instagram.com/perki.aachen/">@perki.aachen</Link>
      </div>
    </footer>
  );
};
