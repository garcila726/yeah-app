"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { Html5QrcodeScanner } from "html5-qrcode";

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
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    fetchUserAndRole();
    fetchEvents();
  }, []);

  useEffect(() => {
    if (showQR) {
      startScanner();
    } else {
      stopScanner();
    }
  }, [showQR]);

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

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error al cerrar sesión:", error.message);
    } else {
      window.location.href = "/";
    }
  };

  const startScanner = () => {
  if (!scannerRef.current) {
    scannerRef.current = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: 250 },
      false // <- este es el parámetro faltante
    );

    scannerRef.current.render(
      (decodedText: string) => {
        handleAttendance(decodedText, "confirmed");
        setShowQR(false);
      },
      (error: any) => {
        console.warn("Error escaneando código:", error);
      }
    );
  }
};

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch((error: any) => {
        console.error("Error al detener el escáner:", error);
      });
      scannerRef.current = null;
    }
  };

  return (
    <div className="px-4 sm:px-6 py-6 bg-gray-100 min-h-screen">
      {/* Aquí irían los demás componentes de la app */}

      {showQR && (
        <div className="mt-6 flex justify-center">
          <div className="bg-white p-4 rounded-xl shadow-lg w-full max-w-md">
            <h3 className="text-center text-lg font-semibold mb-4">
              Escanea el código QR
            </h3>
            <div id="qr-reader" className="w-full" />
            <button
              onClick={() => setShowQR(false)}
              className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 w-full"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
