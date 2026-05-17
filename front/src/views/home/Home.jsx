import React from "react";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";

const Home = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-grow bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="mb-6 text-4xl font-bold text-gray-800 md:text-5xl">
              Fitnes faoliyatni boshqarish platformasi
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600">
              Buxoro Xalqaro Universiteti talabalarining ilmiy-tadqiqot ishlarini
              boshqarish va monitoring qilish uchun zamonaviy elektron platforma
            </p>

            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <div className="rounded-xl bg-white p-6 shadow-lg transition-transform hover:scale-105">
                <div className="mb-4 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                    <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-800">Ilmiy ishlar</h3>
                <p className="text-gray-600">
                  Talabalarning ilmiy-tadqiqot ishlarini rejalashtirish va kuzatish
                </p>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-lg transition-transform hover:scale-105">
                <div className="mb-4 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                    <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-800">Monitoring</h3>
                <p className="text-gray-600">
                  Ilmiy faoliyat ko'rsatkichlarini real vaqtda kuzatish
                </p>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-lg transition-transform hover:scale-105">
                <div className="mb-4 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                    <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-800">Boshqaruv</h3>
                <p className="text-gray-600">
                  Ilmiy rahbarlar va ma'muriyat uchun boshqaruv vositalari
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
