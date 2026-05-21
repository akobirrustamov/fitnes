import React from "react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-r from-blue-800 to-blue-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <h3 className="mb-4 text-lg font-bold">FitCRM</h3>
            <p className="text-sm text-blue-100">
              Fitnes markazlarini boshqarish uchun zamonaviy CRM platformasi
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-bold">Aloqa</h3>
            <ul className="space-y-2 text-sm text-blue-100">
              <li>O'zbekiston</li>
              <li>Tel: +998 (XX) XXX-XX-XX</li>
              <li>Email: info@fitcrm.uz</li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-bold">Foydali havolalar</h3>
            <ul className="space-y-2 text-sm text-blue-100">
              <li>
                <a href="/admin/login" className="hover:text-white transition-colors">
                  Admin kirish
                </a>
              </li>
              <li>
                <a href="/client/login" className="hover:text-white transition-colors">
                  Mijoz kirish
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-blue-700 pt-6 text-center">
          <p className="text-sm text-blue-200">
            © {currentYear} FitCRM. Barcha huquqlar himoyalangan.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
