"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import QrReader from "react-qr-reader";

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    fetchUserAndRole();
    fetchEvents();
  }, []);

  const fetchUserAndRole = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setUserEmail(user.email || "");
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
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .gte("date", today)
      .order("date", { ascending: true });

    if (error) {
      console.error("Error fetching events:", error.message);
    } else {
      setEvents(data || []);
    }
  };

  const handleAddEvent = async () => {
    if (editingId) {
      const { error } = await supabase
        .from("events")
        .update({ title, description, date })
        .eq("id", editingId);

      if (error) {
        console.error("Error actualizando evento:", error.message);
      } else {
        setEditingId(null);
        setTitle("");
        setDescription("");
        setDate("");
        fetchEvents();
      }
    } else {
      const { error } = await supabase.from("events").insert([
        { title, description, date },
      ]);

      if (error) {
        console.error("Error agregando evento:", error.message);
      } else {
        setTitle("");
        setDescription("");
        setDate("");
        fetchEvents();
      }
    }
  };

  const handleEdit = (event: Event) => {
    setEditingId(event.id);
    setTitle(event.title);
    setDescription(event.description);
    setDate(event.date);
  };

  const handleAttendance = async (eventId: string, status: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Debes iniciar sesión.");
      return;
    }

    const { error } = await supabase.from("attendance").upsert({
      user_id: user.id,
      event_id: eventId,
      status: status,
      timestamp: null,
      points_awarded: null,
    });

    if (error) {
      console.error("Error registrando asistencia:", error.message);
      alert("No se pudo registrar la asistencia.");
    } else {
      alert("¡Tu respuesta ha sido registrada!");
    }
  };

  const handleScan = async (data: string | null) => {
    if (data) {
      const eventId = data;
      handleAttendance(eventId, "confirmed");
      setShowQR(false);
    }
  };

  const handleError = (err: any) => {
    console.error("Error escaneando código QR:", err);
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
    <div className="px-4 sm:px-6 py-6 bg-gray-100 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-[#0e5d6d]">
            Bienvenido, {userEmail}
          </h1>
          <Image src="/isologo-yeah.png" alt="Isologo Yeah" width={40} height={40} />
        </div>
        <button
          onClick={handleLogout}
          className="bg-[#c83b94] text-white px-4 py-1 rounded hover:bg-[#a72d7a] text-sm"
        >
          Cerrar sesión
        </button>
      </div>

      {role && (
        <p className="text-sm text-gray-700 mb-6 text-center sm:text-left">
          Rol actual: {" "}
          <span
            className={`font-semibold ${
              role === "admin" ? "text-green-600" : "text-blue-600"
            }`}
          >
            {role}
          </span>
        </p>
      )}

      <h2 className="text-2xl font-bold mb-4 text-black text-center flex items-center justify-center gap-2">
        📆 Eventos
      </h2>

      {role === "admin" && (
        <div className="bg-white p-4 rounded-xl shadow mb-6">
          <h3 className="text-xl font-semibold mb-2">
            {editingId ? "Editar evento" : "Agregar nuevo evento"}
          </h3>
          <input
            type="text"
            placeholder="Título"
            className="border p-2 w-full mb-2 rounded text-gray-800 bg-white"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            type="text"
            placeholder="Descripción"
            className="border p-2 w-full mb-2 rounded text-gray-800 bg-white"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="relative mb-2">
            <input
              type="date"
              className="appearance-none border p-2 pr-10 w-full rounded text-gray-800 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#c83b94] focus:border-transparent"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400 text-sm">
              📅
            </div>
          </div>
          <button
            className="bg-[#c83b94] text-white px-4 py-2 rounded w-full sm:w-auto hover:bg-[#a72d7a]"
            onClick={handleAddEvent}
          >
            {editingId ? "Guardar cambios" : "Agregar Evento"}
          </button>
        </div>
      )}

      <div className="grid gap-4">
        {events.map((event) => (
          <div key={event.id} className="bg-white text-gray-800 p-4 rounded-xl shadow">
            <h3 className="text-xl font-bold">{event.title}</h3>
            <p>{event.description}</p>
            <p className="text-sm">{event.date}</p>
            {role === "admin" && (
              <button
                onClick={() => handleEdit(event)}
                className="text-sm text-yellow-600 underline mt-2"
              >
                Editar
              </button>
            )}
            {role === "student" && (
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  onClick={() => handleAttendance(event.id, "pending")}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  Asistiré
                </button>
                <button
                  onClick={() => handleAttendance(event.id, "rejected")}
                  className="bg-gray-400 text-white px-3 py-1 rounded text-sm hover:bg-gray-500"
                >
                  No puedo
                </button>
                <button
                  onClick={() => setShowQR(true)}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                >
                  Escanear QR
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {showQR && (
        <div className="mt-6 flex justify-center">
          <div className="bg-white p-4 rounded-xl shadow-lg w-full max-w-md">
            <h3 className="text-center text-lg font-semibold mb-4">Escanea el código QR</h3>
            <QrReader delay={300} onError={handleError} onScan={handleScan} style={{ width: "100%" }} />
            <button
              onClick={() => setShowQR(false)}
              className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 w-full"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <hr className="my-10 border-t-2 border-[#2a96af]" />

      <div className="mt-10 bg-gray-200 p-6 rounded-2xl shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
          🎁 Beneficios exclusivos
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white p-4 rounded-xl shadow">
            <h3 className="text-lg font-bold text-[#2a96af]">
              10% de descuento en cursos de inglés
            </h3>
            <p className="text-sm text-gray-600">Válido en escuelas aliadas.</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow">
            <h3 className="text-lg font-bold text-[#2a96af]">Eventos VIP</h3>
            <p className="text-sm text-gray-600">
              Invitaciones prioritarias para eventos YEAH.
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow">
            <h3 className="text-lg font-bold text-[#2a96af]">Regalos mensuales</h3>
            <p className="text-sm text-gray-600">
              Sorteos entre estudiantes activos 🎉
            </p>
          </div>
        </div>
      </div>

      <div className="mt-10 text-center bg-gray-200 p-6 rounded-2xl shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">📲 Síguenos en redes</h2>
        <div className="flex justify-center gap-6 text-2xl">
          <a
            href="https://www.instagram.com/yeahglobaleducation/"
            target="_blank"
            rel="noreferrer"
          >
            📸
          </a>
          <a
            href="https://www.tiktok.com/@yeahglobaleducation"
            target="_blank"
            rel="noreferrer"
          >
            🎵
          </a>
          <a
            href="https://wa.me/+61424075119"
            target="_blank"
            rel="noreferrer"
          >
            💬
          </a>
          <a
            href="https://www.youtube.com/@yeaheducation5334"
            target="_blank"
            rel="noreferrer"
          >
            ▶️
          </a>
        </div>
      </div>
    </div>
  );
}
