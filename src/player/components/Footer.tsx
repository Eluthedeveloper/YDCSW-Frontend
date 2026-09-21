import { Phone, Mail, Headphones } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t dark:border-white/5 border-dark-300 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <Headphones size={16} className="text-white" />
            </div>
            <span className="font-bold gradient-text text-sm">Yemisrach Dimts AudioStream</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="tel:+251911000000" className="flex items-center gap-2 text-sm dark:text-dark-200 text-dark-600 hover:text-primary-400 transition-colors">
              <Phone size={14} />
              <span>+251 911 000 000</span>
            </a>
            <a href="mailto:info@yemisrachdimts.com" className="flex items-center gap-2 text-sm dark:text-dark-200 text-dark-600 hover:text-primary-400 transition-colors">
              <Mail size={14} />
              <span>info@yemisrachdimts.com</span>
            </a>
          </div>

          <p className="text-xs dark:text-dark-300 text-dark-500">
            &copy; {new Date().getFullYear()} Yemisrach Dimts Media
          </p>
        </div>
      </div>
    </footer>
  );
}
