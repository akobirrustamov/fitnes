import React from "react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-r from-blue-800 to-blue-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <h3 className="mb-4 text-lg font-bold">ILMIY.BXU.UZ</h3>
            <p className="text-sm text-blue-100">
              Buxoro Xalqaro Universiteti ilmiy faoliyatni boshqarish platformasi
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-bold">Aloqa</h3>
            <ul className="space-y-2 text-sm text-blue-100">
              <li>Manzil: Buxoro, O'zbekiston</li>
              <li>Tel: +998 (XX) XXX-XX-XX</li>
              <li>Email: info@bxu.uz</li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-bold">Foydali havolalar</h3>
            <ul className="space-y-2 text-sm text-blue-100">
              <li>
                <a href="https://bxu.uz" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Asosiy sayt
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Yordam
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-blue-700 pt-6 text-center">
          <p className="text-sm text-blue-200">
            © {currentYear} Buxoro Xalqaro Universiteti. Barcha huquqlar himoyalangan.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
