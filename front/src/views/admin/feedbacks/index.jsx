import React, { useState } from "react";
import ApiCall from "config";
import PhoneInput from "components/PhoneInput";
import { Send } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const EMPTY = { title: "", description: "", email: "", phoneNumber: "+998" };

export default function FeedbacksPage() {
  const [form, setForm] = useState(EMPTY);
  const [sending, setSending] = useState(false);

  const handleInput = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Sarlavha va tavsif kiritilishi shart");
      return;
    }
    setSending(true);
    const res = await ApiCall("/api/v1/organizations/feedbacks/send", "POST", {
      title: form.title.trim(),
      description: form.description.trim(),
      email: form.email.trim(),
      phoneNumber: form.phoneNumber.trim(),
    });
    setSending(false);
    if (!res?.error) {
      toast.success("Murojaat muvaffaqiyatli yuborildi");
      setForm(EMPTY);
    } else {
      toast.error(res.data?.message || "Yuborishda xatolik yuz berdi");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-gray-900">Murojaat yuborish</h1>
          <p className="mt-1 text-sm text-gray-500">
            Taklif, shikoyat yoki savolingizni yuboring — tizim administratori ko'rib chiqadi.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Sarlavha <span className="text-pink-500">*</span>
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleInput}
                required
                placeholder="Masalan: Taklif yoki shikoyat"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Tavsif <span className="text-pink-500">*</span>
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleInput}
                required
                rows={5}
                placeholder="Muammoni yoki taklifni batafsil yozing..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleInput}
                  placeholder="info@example.com"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Telefon</label>
                <PhoneInput
                  name="phoneNumber"
                  value={form.phoneNumber}
                  onChange={handleInput}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:opacity-60"
            >
              <Send size={16} />
              {sending ? "Yuborilmoqda..." : "Yuborish"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
