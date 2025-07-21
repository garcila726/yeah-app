"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import dynamic from "next/dynamic";

const QrScanner = dynamic(() => import("react-qr-scanner"), { ssr: false });

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
      {/* ... otros elementos omitidos por brevedad ... */}

      {showQR && (
        <div className="mt-6 flex justify-center">
          <div className="bg-white p-4 rounded-xl shadow-lg w-full max-w-md">
            <h3 className="text-center text-lg font-semibold mb-4">
              Escanea el código QR
            </h3>
            <QrScanner
              delay={300}
              onError={handleError}
              onScan={(result: any) => {
                if (result?.text) {
                  handleScan(result.text);
                }
              }}
              style={{ width: "100%" }}
            />
            <button
              onClick={() => setShowQR(false)}
              className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 w-full"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ... resto del JSX ... */}
    </div>
  );
}
