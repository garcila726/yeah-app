"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
}

export default function DashboardPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [role, setRole] = useState<"admin" | "student" | null>(null);

  useEffect(() => {
    fetchRole();
    fetchEvents();
  }, []);

  const fetchRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching role:", error.message);
      } else {
        setRole(data?.role);
      }
    }
  };

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("date", { ascending: true });

    if (error) {
      console.error("Error fetching events:", error.message);
    } else {
      setEvents(data || []);
    }
  };

  const handleAddEvent = async () => {
    const { data, error } = await supabase.from("events").insert([
      {
        title,
        description,
        date,
      },
    ]);

    if (error) {
      console.error("Error adding event:", error.message);
    } else {
      setTitle("");
      setDescription("");
      setDate("");
      fetchEvents();
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error al cerrar sesión:", error.message);
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="px-4 sm:px-6 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
        <h1 className="text-3xl font-bold text-primary text-center sm:text-left">
          Eventos YEAH
        </h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700 text-sm"
        >
          Cerrar sesión
        </button>
      </div>

      {role && (
        <p className="text-sm text-gray-700 mb-6 text-center sm:text-left">
          Rol actual:{" "}
          <span
            className={`font-semibold ${
              role === "admin" ? "text-green-600" : "text-blue-600"
            }`}
          >
            {role}
          </span>
        </p>
      )}

      {role === "admin" && (
        <div className="bg-white p-4 rounded-xl shadow mb-6">
          <h2 className="text-xl font-semibold mb-2">Agregar nuevo evento</h2>
          <input
            type="text"
            placeholder="Título"
            className="border p-2 w-full mb-2 rounded"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            type="text"
            placeholder="Descripción"
            className="border p-2 w-full mb-2 rounded"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <input
            type="date"
            className="border p-2 w-full mb-2 rounded"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button
            className="bg-primary text-white px-4 py-2 rounded w-full sm:w-auto"
            onClick={handleAddEvent}
          >
            Agregar Evento
          </button>
        </div>
      )}

      <div className="grid gap-4">
        {events.map((event) => (
          <div
            key={event.id}
            className="bg-secondary text-white p-4 rounded-xl shadow"
          >
            <h3 className="text-xl font-bold">{event.title}</h3>
            <p>{event.description}</p>
            <p className="text-sm">{event.date}</p>
          </div>
        ))}
      </div>

      <hr className="my-10 border-t-2 border-secondary" />

      <div className="mt-10 bg-gray-100 p-6 rounded-2xl shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
          🎁 Beneficios exclusivos
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white p-4 rounded-xl shadow">
            <h3 className="text-lg font-bold text-secondary">
              10% de descuento en cursos de inglés
            </h3>
            <p className="text-sm text-gray-600">
              Válido en escuelas aliadas.
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow">
            <h3 className="text-lg font-bold text-secondary">Eventos VIP</h3>
            <p className="text-sm text-gray-600">
              Invitaciones prioritarias para eventos YEAH.
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow">
            <h3 className="text-lg font-bold text-secondary">
              Regalos mensuales
            </h3>
            <p className="text-sm text-gray-600">
              Sorteos entre estudiantes activos 🎉
            </p>
          </div>
        </div>
      </div>

      <div className="mt-10 text-center bg-gray-100 p-6 rounded-2xl shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          📲 Síguenos en redes
        </h2>
        <div className="flex justify-center gap-6 text-2xl">
          <a
            href="https://instagram.com/yeah"
            target="_blank"
            rel="noreferrer"
          >
            📸
          </a>
          <a
            href="https://tiktok.com/@yeah"
            target="_blank"
            rel="noreferrer"
          >
            🎵
          </a>
          <a
            href="https://wa.me/123456789"
            target="_blank"
            rel="noreferrer"
          >
            💬
          </a>
          <a href="https://youtube.com/yeah" target="_blank" rel="noreferrer">
            ▶️
          </a>
        </div>
      </div>
    </div>
  );
}
