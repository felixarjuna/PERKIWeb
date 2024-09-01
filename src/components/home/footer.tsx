import { InstagramLogoIcon } from "@radix-ui/react-icons";
import { Mail, Phone } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="flex flex-col justify-between gap-4 bg-dark-green-default px-10 py-10 text-light-green-default sm:flex-row sm:px-44 sm:py-20">
      <div className="flex items-center gap-4 text-sm sm:text-2xl">
        <Mail className="h-4 w-4 sm:h-6 sm:w-6" />
        <a href="mailto:mita@perki-aachen.com">mita@perki-aachen.com</a>
      </div>
      <div className="flex items-center gap-4 text-sm sm:text-2xl">
        <Phone className="h-4 w-4 sm:h-6 sm:w-6" />
        <a href="tel:+49 17637503305">+49 1745277265</a>
      </div>
      <div className="flex items-center gap-4 text-sm sm:text-2xl">
        <InstagramLogoIcon className="h-4 w-4 sm:h-6 sm:w-6" />
        <Link href="https://www.instagram.com/perki.aachen/">
          @perki.aachen
        </Link>
      </div>
    </footer>
  );
}
