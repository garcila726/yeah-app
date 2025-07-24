"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import Html5QrcodePlugin from "./Html5QrcodePlugin";
import InstagramIcon from '/icons/instagram.png';
import TikTokIcon from '/icons/tiktok.png';
import WhatsAppIcon from '/icons/whatsapp.png';
import YouTubeIcon from '/icons/youtube.png';


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
  const [attendedEvents, setAttendedEvents] = useState<string[]>([]);
  const [completedEvents, setCompletedEvents] = useState<string[]>([]);
  const [respondedEvents, setRespondedEvents] = useState<Record<string, string>>({});
  const [totalPoints, setTotalPoints] = useState<number>(0);




  useEffect(() => {
    fetchUserAndRole();
    fetchEvents();
    testConnection();
    fetchRespondedEvents();
    fetchTotalPoints();

  }, []);

    const fetchRespondedEvents = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("attendance")
      .select("event_id, status")
      .eq("user_id", user.id);

    if (!error && data) {
      const responded = data.reduce((acc: Record<string, string>, item) => {
        acc[item.event_id] = item.status;
        return acc;
      }, {});
      setRespondedEvents(responded); // ⬅️ Este nuevo estado lo creamos abajo
    }
  };


  const fetchUserAndRole = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("No hay usuario autenticado");

      setUserEmail(user.email || "");

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error || !data) {
        console.warn("⚠️ No se encontró el perfil o hubo un error:", error);
        return;
      }

      setRole(data.role);
    } catch (err) {
      console.error("❌ Error en fetchUserAndRole:", err);
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

    const { data: { user } } = await supabase.auth.getUser();
if (user) {
  const { data: attendanceData } = await supabase
    .from("attendance")
    .select("event_id, status, points_awarded")
    .eq("user_id", user.id);

  if (attendanceData) {
    const responded: { [key: string]: string } = {};
    const completed: string[] = [];
    const attendedIds: string[] = [];

    attendanceData.forEach((row) => {
      responded[row.event_id] = row.status;
      if (row.status === "confirmed") attendedIds.push(row.event_id);
      if (row.status === "confirmed" && row.points_awarded === 10) {
        completed.push(row.event_id);
      }
    });

    setRespondedEvents(responded);
    setAttendedEvents(attendedIds);
    setCompletedEvents(completed);
  }
}


  };

  const fetchTotalPoints = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data, error } = await supabase
    .from("attendance")
    .select("points_awarded")
    .eq("user_id", user.id);

  if (error) {
    console.error("Error al obtener puntos:", error.message);
    return;
  }

  const total = data?.reduce((sum, row) => sum + (row.points_awarded || 0), 0);
  setTotalPoints(total || 0);
};


  const handleAddEvent = async () => {
    const { error } = editingId
      ? await supabase.from("events").update({ title, description, date }).eq("id", editingId)
      : await supabase.from("events").insert([{ title, description, date }]);

    if (error) {
      console.error("Error guardando evento:", error.message);
    } else {
      setTitle("");
      setDescription("");
      setDate("");
      setEditingId(null);
      fetchEvents();
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

    // Verificar si ya existe registro
    const { data: existing, error: checkError } = await supabase
  .from("attendance")
  .select("event_id") // ✅ usamos un campo que sí existe
  .eq("user_id", user.id)
  .eq("event_id", eventId)
  .maybeSingle();

    if (checkError) {
      console.error("Error verificando asistencia previa:", checkError.message);
      alert("Hubo un error al verificar tu asistencia.");
      return;
    }

    if (existing) {
      alert("❗Ya estás registrado para este evento.");
      return;
    }

    const attendanceData = {
      user_id: user.id,
      event_id: eventId,
      status,
      timestamp: new Date().toISOString(),
      points_awarded: 0, // Se asignan los puntos solo al escanear QR
    };

    const { error } = await supabase.from("attendance").insert([attendanceData]);

    if (error) {
      console.error("❌ Error registrando asistencia:", error.message);
      alert("No se pudo registrar la asistencia.");
    } else {
      alert("✅ ¡Tu respuesta ha sido registrada!");
    }
  };

  const hasAlreadyAttended = async (eventId: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from("attendance")
    .select("id")
    .eq("user_id", user.id)
    .eq("event_id", eventId)
    .eq("status", "confirmed")
    .single();

  return !!data;
};



const handleScan = async (data: string) => {
  if (!data) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Validar si ya tiene puntos
  const { data: existing } = await supabase
    .from("attendance")
    .select("points_awarded")
    .eq("user_id", user.id)
    .eq("event_id", data)
    .single();

  if (existing?.points_awarded === 10) {
    alert("✅ Ya registraste tu asistencia con QR.");
    setShowQR(false);
    return;
  }

  const { error } = await supabase
    .from("attendance")
    .update({ points_awarded: 10 })
    .eq("user_id", user.id)
    .eq("event_id", data);

  if (error) {
    console.error("❌ Error al registrar QR:", error.message);
    alert("Error al registrar QR.");
  } else {
    alert("🎉 ¡Asistencia confirmada y 10 puntos otorgados!");
    fetchEvents(); // Actualiza estados
    setShowQR(false);
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

  const testConnection = async () => {
    const { data, error } = await supabase.from("attendance").select("*").limit(1);
    console.log("🔌 Test conexión Supabase:", { data, error });
  };

  const handleDeleteAttendance = async (eventId: string) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    alert("Debes iniciar sesión para eliminar asistencia.");
    return;
  }

  const { error } = await supabase
    .from("attendance")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", user.id);

  if (error) {
    console.error("❌ Error al eliminar asistencia:", error.message);
    alert("No se pudo eliminar la asistencia.");
  } else {
    alert("✅ Asistencia eliminada correctamente.");
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
  <>
    <p className="text-sm text-gray-700 mb-1 text-center sm:text-left">
      Rol actual:{" "}
      <span className={`font-semibold ${role === "admin" ? "text-green-600" : "text-blue-600"}`}>
        {role}
      </span>
    </p>
    <div className="text-sm text-center sm:text-left font-semibold text-green-700 mb-6">
      🌱 Puntos acumulados: {totalPoints}
    </div>
  </>
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
          <input
            type="date"
            className="border p-2 w-full mb-2 rounded text-gray-800 bg-white"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button
            className="bg-[#c83b94] text-white px-4 py-2 rounded w-full sm:w-auto hover:bg-[#a72d7a]"
            onClick={handleAddEvent}
          >
            {editingId ? "Guardar cambios" : "Agregar Evento"}
          </button>
        </div>
      )}

      <div className="grid gap-4">
        {events
  .filter((event) => respondedEvents[event.id] !== "rejected") // 👈 Ocultar eventos rechazados
  .map((event) => (

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
    {completedEvents.includes(event.id) ? (
      <p className="text-green-600 font-semibold">🎉 Asistencia completada</p>
    ) : respondedEvents[event.id] === "confirmed" ? (
      <>
        <p className="text-green-600 font-semibold">✅ Confirmado</p>
        <button
          onClick={() => setShowQR(true)}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
        >
          Escanear QR
        </button>
      </>
    ) : (
      <>
        <button
          onClick={() => handleAttendance(event.id, "confirmed")}
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
      </>
    )}
  </div>
)}


          </div>
        ))}
      </div>

      {showQR && (
        <div className="mt-6 flex justify-center">
          <div className="bg-white p-4 rounded-xl shadow-lg w-full max-w-md">
            <h3 className="text-center text-lg font-semibold mb-4">
              Escanea el código QR
            </h3>
            <Html5QrcodePlugin onScan={handleScan} />
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
              Grandes Sorpresas
            </h3>
            <p className="text-sm text-gray-600">Todo el año para nuestros usuarios activos</p>
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
<div className="flex justify-center gap-6">
  <a href="https://www.instagram.com/yeahglobaleducation/" target="_blank" rel="noreferrer">
    <Image src="/icons/instagram.png" alt="Instagram" width={30} height={30} />
  </a>
  <a href="https://www.tiktok.com/@yeahglobaleducation" target="_blank" rel="noreferrer">
    <Image src="/icons/tiktok.png" alt="TikTok" width={30} height={30} />
  </a>
  <a href="https://wa.me/+61424075119" target="_blank" rel="noreferrer">
    <Image src="/icons/whatsapp.png" alt="WhatsApp" width={30} height={30} />
  </a>
  <a href="https://www.youtube.com/@yeaheducation5334" target="_blank" rel="noreferrer">
    <Image src="/icons/youtube.png" alt="YouTube" width={30} height={30} />
  </a>
</div>


  {/* ✅ Aquí dentro del mismo bloque visual */}
  <p className="text-sm text-[#2a96af]">
    “No vendemos destinos... Creamos caminos”
  </p>
</div>

      
    </div>
  );
}
