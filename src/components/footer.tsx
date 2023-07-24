import { Instagram, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="flex justify-between px-44 py-20 bg-dark-green-default text-light-green-default">
      <div className="flex gap-4 items-center text-2xl">
        <Mail className="w-6 h-6" />
        <a href="mailto:mita@perki-aachen.com">mita@perki-aachen.com</a>
      </div>
      <div className="flex gap-4 items-center text-2xl">
        <Phone className="w-6 h-6" />
        <a href="tel:+49 17637503305">+49 17637503305</a>
      </div>
      <div className="flex gap-4 items-center text-2xl">
        <Instagram className="w-6 h-6" />
        <Link to="https://www.instagram.com/perki.aachen/">@perki.aachen</Link>
      </div>
    </footer>
  );
};
