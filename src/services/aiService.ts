import {
  CampusEvent,
  CampusAnnouncement,
  StudentProfile,
  EventRegistration,
  AIMessage,
  PosterExtractionResult,
  EventCategory,
} from '../types';

export interface AIUserContext {
  name: string;
  role: string;
  email?: string;
  faculty?: string;
  major?: string;
}

export interface AIContext {
  page?: string;
  eventId?: string;
  events: CampusEvent[];
  announcements: CampusAnnouncement[];
  student: StudentProfile | null;
  user?: AIUserContext;
  registrations: EventRegistration[];
}

export interface IAIProvider {
  chat(userMessage: string, context: AIContext, history?: AIMessage[]): Promise<AIMessage>;
  generateGreeting(context: AIContext): Promise<string>;
  extractPoster(posterInput: File | string): Promise<PosterExtractionResult>;
}

// ----------------------------------------------------
// Strict Domain Locking and Refusal Keywords (Part 28)
// ----------------------------------------------------
const REFUSAL_RESPONSE =
  "I'm KlabatSync AI Assistant. I can only help with information, events, schedules, announcements, and features available within the KlabatSync platform. Please ask me something related to KlabatSync.";

const FORBIDDEN_TOPICS = [
  'write a python', 'write python', 'write code', 'write a program', 'debug this code',
  'solve my homework', 'essay about', 'math problem', 'integral of', 'derive',
  'ignore previous instructions', 'ignore all instructions', 'developer mode',
  'system prompt', 'act as a', 'pretend you are', 'unrestricted gemini',
  'who won the world cup', 'recipe for', 'stock price', 'bitcoin', 'crypto price'
];

export class MockDemoAIAdapter implements IAIProvider {
  async chat(userMessage: string, context: AIContext, _history?: AIMessage[]): Promise<AIMessage> {
    // Artificial slight delay for realistic responsiveness
    await new Promise((resolve) => setTimeout(resolve, 600));

    const query = userMessage.toLowerCase().trim();

    // Check Prompt Injection / Domain Lock
    for (const forbidden of FORBIDDEN_TOPICS) {
      if (query.includes(forbidden)) {
        return {
          id: 'ai-msg-' + Date.now(),
          sender: 'ai',
          content: REFUSAL_RESPONSE,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSimulated: true,
        };
      }
    }

    // Casual greeting handling
    if (['hello', 'hi', 'hai', 'halo', 'selamat pagi', 'selamat siang', 'selamat malam'].includes(query)) {
      const activeName = context.user?.name || (context.student ? context.student.fullName : 'Pengguna');
      const firstName = activeName.split(' ')[0];
      return {
        id: 'ai-msg-' + Date.now(),
        sender: 'ai',
        content: `Hello ${firstName}! I am your KlabatSync AI Assistant. I can help you check your campus schedule, upcoming UNKLAB chapel points, hackathons, or dormitory announcements. What would you like to explore?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSimulated: true,
      };
    }

    // 1. Contextual Event Q&A (if on an event detail page or asking about a specific event)
    if (context.eventId) {
      const event = context.events.find((e) => e.id === context.eventId);
      if (event) {
        if (query.includes('jean') || query.includes('wear') || query.includes('baju') || query.includes('pakaian') || query.includes('dress code')) {
          return {
            id: 'ai-msg-' + Date.now(),
            sender: 'ai',
            content: event.dressCode
              ? `The required dress code for **${event.title}** is: *${event.dressCode}*. Please ensure compliance with UNKLAB grooming standards.`
              : 'This information has not been provided in the event announcement. Please contact the organizer.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSimulated: true,
            sourceAttributions: [{ title: event.title, module: 'Explore Events', date: event.startDate }],
          };
        }

        if (query.includes('point') || query.includes('chapel') || query.includes('poin')) {
          const pts = event.chapelPoints ?? 0;
          return {
            id: 'ai-msg-' + Date.now(),
            sender: 'ai',
            content: pts > 0
              ? `Yes! Attending **${event.title}** awards **${pts} Chapel Point(s)** upon verified presence scan at Pioneer Chapel.`
              : `No chapel points are awarded for **${event.title}**.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSimulated: true,
            sourceAttributions: [{ title: event.title, module: 'Event Details', date: event.startDate }],
          };
        }

        if (query.includes('lokasi') || query.includes('location') || query.includes('where') || query.includes('tempat')) {
          return {
            id: 'ai-msg-' + Date.now(),
            sender: 'ai',
            content: `The venue for **${event.title}** is **${event.location}**.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSimulated: true,
            sourceAttributions: [{ title: event.title, module: 'Event Details', date: event.startDate }],
          };
        }

        if (query.includes('duration') || query.includes('how long') || query.includes('berapa lama') || query.includes('jam')) {
          if (event.startTime && event.endTime) {
            return {
              id: 'ai-msg-' + Date.now(),
              sender: 'ai',
              content: `The event is scheduled from **${event.startTime}** to **${event.endTime} WITA** on ${event.startDate}.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isSimulated: true,
              sourceAttributions: [{ title: event.title, module: 'Event Details', date: event.startDate }],
            };
          } else {
            return {
              id: 'ai-msg-' + Date.now(),
              sender: 'ai',
              content: 'The end time for this event is currently unspecified by the organizer.',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isSimulated: true,
            };
          }
        }
      }
    }

    // 2. Schedule / Agenda queries ("What is my schedule?", "jadwal saya")
    if (query.includes('schedule') || query.includes('agenda') || query.includes('jadwal') || query.includes('tomorrow') || query.includes('besok')) {
      const registeredIds = context.registrations.filter((r) => r.status === 'going').map((r) => r.eventId);
      const myEvents = context.events.filter((e) => registeredIds.includes(e.id));

      if (myEvents.length === 0) {
        return {
          id: 'ai-msg-' + Date.now(),
          sender: 'ai',
          content: 'You currently have no confirmed RSVPs in your personal agenda. Browse **Explore Events** to RSVP for campus activities, chapel services, or seminars.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSimulated: true,
        };
      }

      const listStr = myEvents
        .slice(0, 4)
        .map((e) => `• **${e.title}** (${e.startDate} at ${e.startTime} WITA - ${e.location})`)
        .join('\n');

      return {
        id: 'ai-msg-' + Date.now(),
        sender: 'ai',
        content: `Here is your upcoming schedule based on the events registered to your account:\n\n${listStr}\n\nYou can view full details in **My Agenda**.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSimulated: true,
        sourceAttributions: myEvents.map((e) => ({ title: e.title, module: 'My Agenda', date: e.startDate })),
      };
    }

    // 3. Recommendations by faculty or interests ("recommend for fik", "rekomendasi")
    if (query.includes('fik') || query.includes('faculty') || query.includes('fakultas') || query.includes('recommend') || query.includes('rekomendasi')) {
      const studentFaculty = context.student?.faculty || 'FIK';
      const matchingEvents = context.events.filter(
        (e) => !e.eligibleFaculties || e.eligibleFaculties.length === 0 || e.eligibleFaculties.includes(studentFaculty)
      );

      const items = matchingEvents
        .slice(0, 3)
        .map((e) => `• **${e.title}** [${e.category.toUpperCase()}] on ${e.startDate} at ${e.location}`)
        .join('\n');

      return {
        id: 'ai-msg-' + Date.now(),
        sender: 'ai',
        content: `Here are active campus activities aligned with **${studentFaculty}** students:\n\n${items}\n\nAll dates are grounded in live UNKLAB platform data.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSimulated: true,
        sourceAttributions: matchingEvents.slice(0, 3).map((e) => ({ title: e.title, module: 'Explore Events', date: e.startDate })),
      };
    }

    // 4. Chapel points query
    if (query.includes('chapel') || query.includes('poin')) {
      const chapelEvents = context.events.filter((e) => (e.chapelPoints ?? 0) > 0);
      const list = chapelEvents
        .map((e) => `• **${e.title}** (+${e.chapelPoints} pts) on ${e.startDate} at ${e.location}`)
        .join('\n');

      return {
        id: 'ai-msg-' + Date.now(),
        sender: 'ai',
        content: `Here are upcoming chapel & spiritual activities offering chapel points:\n\n${list}\n\n*Note: Points require verified presence scan at Pioneer Chapel.*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSimulated: true,
        sourceAttributions: chapelEvents.map((e) => ({ title: e.title, module: 'Explore Events' })),
      };
    }

    // 5. Announcements query
    if (query.includes('announcement') || query.includes('pengumuman')) {
      const recent = context.announcements.slice(0, 3);
      const list = recent.map((a) => `• **${a.title}** (${a.organizer} · ${a.date})`).join('\n');

      return {
        id: 'ai-msg-' + Date.now(),
        sender: 'ai',
        content: `Latest official announcements published in KlabatSync:\n\n${list}\n\nVisit the **Announcements** page to read the full circulars.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSimulated: true,
        sourceAttributions: recent.map((a) => ({ title: a.title, module: 'Announcements', date: a.date })),
      };
    }

    // Default grounded helpful response for general campus questions
    return {
      id: 'ai-msg-' + Date.now(),
      sender: 'ai',
      content:
        `I am your KlabatSync Campus Assistant. You can ask me:\n` +
        `• "What is my schedule tomorrow?"\n` +
        `• "Which events offer chapel points?"\n` +
        `• "Recommend activities for FIK students."\n` +
        `• "What are the latest campus announcements?"\n\n` +
        `All information is synchronized with Universitas Klabat live events.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSimulated: true,
    };
  }

  async extractPoster(_posterInput: File | string): Promise<PosterExtractionResult> {
    throw new Error('Kunci API Gemini diperlukan untuk fitur ekstraksi visual poster AI.');
  }

  async generateGreeting(context: AIContext): Promise<string> {
    const activeName = context.user?.name || (context.student ? context.student.fullName : 'Pengguna');
    const firstName = activeName.split(' ')[0];
    return `Halo ${firstName}! Saya Asisten AI KlabatSync. Ada agenda kampus, jadwal, atau poin chapel yang ingin dicek hari ini?`;
  }
}

export class BackendAPIAdapter implements IAIProvider {
  private apiEndpoint: string;

  constructor(apiEndpoint = '/api/ai') {
    this.apiEndpoint = apiEndpoint;
  }

  async chat(userMessage: string, context: AIContext, history?: AIMessage[]): Promise<AIMessage> {
    try {
      const res = await fetch(`${this.apiEndpoint}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, context, history }),
      });
      if (!res.ok) throw new Error('Backend AI unavailable');
      return await res.json();
    } catch {
      // Graceful fallback to MockDemoAIAdapter
      const fallback = new MockDemoAIAdapter();
      return fallback.chat(userMessage, context);
    }
  }

  async extractPoster(posterInput: File | string): Promise<PosterExtractionResult> {
    try {
      const formData = new FormData();
      if (posterInput instanceof File) {
        formData.append('file', posterInput);
      } else {
        formData.append('presetId', posterInput);
      }

      const res = await fetch(`${this.apiEndpoint}/extract-poster`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Backend poster extraction unavailable');
      return await res.json();
    } catch {
      const fallback = new MockDemoAIAdapter();
      return fallback.extractPoster(posterInput);
    }
  }

  async generateGreeting(context: AIContext): Promise<string> {
    const fallback = new MockDemoAIAdapter();
    return fallback.generateGreeting(context);
  }
}

// ----------------------------------------------------
// Google Gemini (free tier) adapter
// ----------------------------------------------------
export class GeminiAIAdapter implements IAIProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = 'gemini-3-flash-preview') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async chat(userMessage: string, context: AIContext, history?: AIMessage[]): Promise<AIMessage> {
    const focusedEvent = context.eventId
      ? context.events.find((e) => e.id === context.eventId)
      : undefined;

    let focusedEventBlock = '';
    if (focusedEvent) {
      focusedEventBlock =
        `\n=== INFORMASI ACARA/KEGIATAN YANG SEDANG DIBUKA & DITANYAKAN SAAT INI ===\n` +
        `- Judul Acara: ${focusedEvent.title}\n` +
        `- Kategori: ${focusedEvent.category}\n` +
        `- Penyelenggara: ${focusedEvent.organizer}\n` +
        `- Tanggal: ${focusedEvent.startDate}${focusedEvent.endDate && focusedEvent.endDate !== focusedEvent.startDate ? ` s/d ${focusedEvent.endDate}` : ''}\n` +
        `- Waktu: Mulai ${focusedEvent.startTime || '08:00'} WITA${focusedEvent.endTime ? ` s/d ${focusedEvent.endTime} WITA` : ' (jam selesai belum ditentukan secara spesifik oleh panitia)'}\n` +
        `- Lokasi/Tempat: ${focusedEvent.location}\n` +
        `- Ketentuan Pakaian (Dress Code): ${focusedEvent.dressCode || 'Tidak ditentukan secara khusus (ikuti aturan kesopanan berpakaian UNKLAB)'}\n` +
        `- Poin Chapel: ${focusedEvent.chapelPoints && focusedEvent.chapelPoints > 0 ? `${focusedEvent.chapelPoints} Poin Chapel` : '0 (Tidak memberikan poin chapel)'}\n` +
        `- Kapasitas/Pendaftaran: ${focusedEvent.capacity ? `${focusedEvent.capacity} peserta` : 'Terbuka'}${focusedEvent.registrationDeadline ? `, Batas Pendaftaran: ${focusedEvent.registrationDeadline}` : ''}\n` +
        `- Deskripsi Acara: ${focusedEvent.description}\n` +
        `ATURAN KHUSUS DETAIL ACARA:\n` +
        `Pengguna sedang melihat halaman detail acara "${focusedEvent.title}". Seluruh pertanyaan pengguna (seperti "Can I wear jeans?", "How long will it last?", "Does this provide chapel points?", "Where exactly is the venue?") adalah tentang acara "${focusedEvent.title}" ini! Jawablah secara spesifik, akurat, dan langsung berdasarkan data acara tersebut tanpa menanyakan kembali nama acaranya!`;
    }

    const eventList = context.events.slice(0, 15).map((e) => {
      const parts = [`${e.title} [Tanggal: ${e.startDate}${e.startTime ? ' ' + e.startTime : ''}, Lokasi: ${e.location}]`];
      if (e.chapelPoints && e.chapelPoints > 0) parts.push(`${e.chapelPoints} Poin Chapel`);
      if (e.category) parts.push(`Kategori: ${e.category}`);
      if (e.eligibleFaculties && e.eligibleFaculties.length > 0) parts.push(`Fakultas: ${e.eligibleFaculties.join(', ')}`);
      return parts.join(' - ');
    }).join('\n');

    const registeredIds = new Set(context.registrations.filter((r) => r.status === 'going').map((r) => r.eventId));
    const studentAgenda = context.events.filter((e) => registeredIds.has(e.id)).map((e) => `${e.title} pada ${e.startDate}`).join('; ');

    const announcementList = context.announcements.slice(0, 5).map((a) => `• ${a.title} (${a.date})`).join('\n');

    const userName = context.user?.name || context.student?.fullName || 'Pengguna UNKLAB';
    const userRole = context.user?.role || (context.student ? 'student' : 'guest');
    const userRoleLabel = userRole === 'student' ? 'Mahasiswa' : `Administrator (${userRole.replace('_', ' ')})`;
    const userFaculty = context.user?.faculty || context.student?.faculty || '';
    const firstName = userName.split(' ')[0];

    const systemPrompt =
      `Anda adalah Asisten AI KlabatSync, asisten kecerdasan kampus resmi untuk Universitas Klabat (UNKLAB) berbasis Google Gemini AI.\n` +
      `Gaya bahasa: Alami, cerdas, santai, ramah, dan solutif (seperti kakak tingkat atau konselor kampus yang pintar), bukan robot atau template kaku.\n` +
      `Bahasa respon: Jawab dalam bahasa yang digunakan oleh pengguna (jika pengguna bertanya dalam bahasa Inggris, jawab dalam bahasa Inggris; jika bahasa Indonesia, jawab dalam bahasa Indonesia).\n\n` +
      `Profil Pengguna Saat Ini:\n` +
      `- Nama: ${userName}\n` +
      `- Status/Peran: ${userRoleLabel}${userFaculty ? `\n- Fakultas: ${userFaculty}` : ''}\n\n` +
      `PANDUAN NAMA & PERCAKAPAN:\n` +
      `- Pengguna saat ini bernama "${userName}". Jika Anda menyapa atau menyebut nama, panggil dengan "${userName}" atau nama depannya "${firstName}" (atau Kak/Pak ${firstName}).\n` +
      `- JANGAN PERNAH memanggil dengan nama lain (seperti Zefanya jika pengguna bukan Zefanya).\n` +
      `- JANGAN mengulang salam pembuka yang panjang di setiap jawaban! Langsung tanggapi dan jawab pesan pengguna secara luwes dan kontekstual layaknya manusia yang sedang mengobrol.\n` +
      `${focusedEventBlock}\n\n` +
      `Data Kampus Terkini (Grounding KlabatSync):\n` +
      `- Agenda/RSVP Pengguna: ${studentAgenda || 'Belum ada agenda terdaftar'}\n` +
      `- Daftar Acara Kampus UNKLAB:\n${eventList || 'Tidak ada kegiatan mendatang'}\n` +
      `- Pengumuman Kampus:\n${announcementList || 'Tidak ada pengumuman'}\n\n` +
      `Batasan Topik (Domain Locking):\n` +
      `Jika pengguna menanyakan topik di luar kehidupan kampus UNKLAB (misal PR koding python/pemrograman umum, soal kalkulus rumit, resep masakan, prediksi kripto/saham), tolak secara santai dan sopan, lalu ajak kembali membahas kegiatan, jadwal, atau informasi seputar kampus UNKLAB.`;

    // Build multi-turn conversational contents
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (history && history.length > 0) {
      // Pick last 8 messages, skipping initial greeting cards
      const relevant = history
        .slice(-8)
        .filter((m) => m.content && !m.id.startsWith('welcome-') && !m.id.startsWith('init-') && !m.id.startsWith('clear-'));

      for (const msg of relevant) {
        const role = msg.sender === 'user' ? 'user' : 'model';
        if (contents.length > 0 && contents[contents.length - 1].role === role) {
          contents[contents.length - 1].parts[0].text += `\n${msg.content}`;
        } else {
          contents.push({ role, parts: [{ text: msg.content }] });
        }
      }
    }

    // Ensure first message has role 'user'
    while (contents.length > 0 && contents[0].role === 'model') {
      contents.shift();
    }

    // Append current user message
    if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
      if (contents[contents.length - 1].parts[0].text !== userMessage) {
        contents[contents.length - 1].parts[0].text += `\n${userMessage}`;
      }
    } else {
      contents.push({ role: 'user', parts: [{ text: userMessage }] });
    }

    try {
      const res = await fetch(
        `/gemini-api/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents,
            generationConfig: { maxOutputTokens: 600, temperature: 0.75 },
          }),
        }
      );
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        console.error('[GeminiAIAdapter] API error', res.status, errBody);
        throw new Error(`Gemini API error (HTTP ${res.status}): ${errBody?.error?.message || 'Gagal memproses'}`);
      }
      const data = await res.json();
      const text =
        data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ||
        'Maaf, saya tidak dapat merespons saat ini.';
      return {
        id: 'ai-msg-' + Date.now(),
        sender: 'ai',
        content: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSimulated: false,
      };
    } catch (err: unknown) {
      console.error('[GeminiAIAdapter] Chat failure:', err);
      // Explicit error response, NO silent mock template fallback!
      const errorMsg = err instanceof Error ? err.message : 'Koneksi ke Gemini AI terputus';
      return {
        id: 'ai-msg-' + Date.now(),
        sender: 'ai',
        content: `⚠️ **Kendala Koneksi Gemini AI:**\n${errorMsg}.\n\nSilakan coba tanyakan kembali atau periksa koneksi internet Anda.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSimulated: false,
      };
    }
  }

  async extractPoster(posterInput: File | string): Promise<PosterExtractionResult> {
    let base64Data = '';
    let mimeType = 'image/jpeg';

    if (posterInput instanceof File) {
      mimeType = posterInput.type || 'image/jpeg';
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(posterInput);
      });
      base64Data = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
    } else if (typeof posterInput === 'string') {
      if (posterInput.startsWith('data:')) {
        const matches = posterInput.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          base64Data = matches[2];
        } else {
          base64Data = posterInput.split(',')[1] || posterInput;
        }
      } else {
        try {
          const resp = await fetch(posterInput);
          const blob = await resp.blob();
          mimeType = blob.type || 'image/jpeg';
          const buffer = await blob.arrayBuffer();
          base64Data = btoa(
            new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
        } catch {
          throw new Error('Gagal membaca gambar poster.');
        }
      }
    }

    if (!base64Data) {
      throw new Error('Data gambar poster tidak valid.');
    }

    const extractionPrompt =
      "Anda adalah asisten AI ekstraksi poster kampus Universitas Klabat (UNKLAB).\n" +
      "Tugas Anda: Baca poster visual yang diunggah secara teliti dan ekstrak seluruh informasi kegiatan kampus ke dalam format JSON murni.\n\n" +
      "Keluarkan format JSON dengan struktur berikut persis:\n" +
      "{\n" +
      '  "title": "string (nama/judul lengkap acara)",\n' +
      '  "category": "spiritual" | "academic" | "ormawa" | "dormitory" | "seminar" | "competition",\n' +
      '  "organizer": "string (nama organisasi/klub/fakultas/panitia)",\n' +
      '  "startDate": "YYYY-MM-DD (format tanggal mulai)",\n' +
      '  "endDate": "YYYY-MM-DD (format tanggal selesai, samakan dengan startDate jika 1 hari)",\n' +
      '  "startTime": "HH:mm (waktu mulai format 24 jam, contoh: 09:00)",\n' +
      '  "endTime": "HH:mm (waktu selesai jika tertera, atau kosongkan)",\n' +
      '  "location": "string (lokasi/tempat acara)",\n' +
      '  "description": "string (deskripsi ringkas tujuan acara, ajakan, dan catatan penting)",\n' +
      '  "dressCode": "string (ketentuan pakaian jika ada, atau kosongkan)",\n' +
      '  "chapelPoints": number (angka 0-5, berikan >0 hanya jika tertulis chapel point / acara ibadah chapel UNKLAB),\n' +
      '  "registrationDeadline": "YYYY-MM-DD (batas waktu pendaftaran jika ada)",\n' +
      '  "capacity": number (kuota peserta jika ada angka),\n' +
      '  "contactInfo": "string (nomor HP / WhatsApp / email narahubung / PIC)"\n' +
      "}\n\n" +
      "PENTING:\n" +
      "- Jangan tambahkan markdown format ```json atau teks pengantar apapun. Kembalikan HANYA string JSON valid.\n" +
      "- Jika ada tanggal seperti 'Minggu, 29 November 2026', konversi menjadi format YYYY-MM-DD (contoh: 2026-11-29).\n" +
      "- Jika kategori merupakan kegiatan himpunan mahasiswa / klub / rekreasi mahasiswa, pilih 'ormawa'. Jika ibadah chapel pilih 'spiritual'.";

    try {
      const res = await fetch(
        `/gemini-api/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: base64Data,
                    },
                  },
                  {
                    text: extractionPrompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 1500,
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        console.error('[GeminiAIAdapter.extractPoster] API error', res.status, errBody);
        throw new Error(`Gemini Vision error (HTTP ${res.status}): ${errBody?.error?.message || 'Gagal memproses gambar'}`);
      }

      const data = await res.json();
      const rawText =
        data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') || '';

      let parsed: any;
      try {
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(rawText.replace(/```json/gi, '').replace(/```/g, '').trim());
      } catch (e) {
        console.error('[GeminiAIAdapter.extractPoster] JSON parse failure:', rawText);
        throw new Error('Gagal mengurai respons JSON dari model AI.');
      }

      const today = new Date().toISOString().split('T')[0];

      return {
        title: parsed.title || 'Kegiatan Kampus UNKLAB',
        category: (parsed.category as EventCategory) || 'academic',
        organizer: parsed.organizer || 'Organisasi Mahasiswa UNKLAB',
        startDate: parsed.startDate || today,
        endDate: parsed.endDate || parsed.startDate || today,
        startTime: parsed.startTime || '08:00',
        endTime: parsed.endTime || undefined,
        location: parsed.location || 'Kampus UNKLAB',
        description: parsed.description || 'Kegiatan resmi Universitas Klabat.',
        dressCode: parsed.dressCode || undefined,
        chapelPoints: typeof parsed.chapelPoints === 'number' ? parsed.chapelPoints : 0,
        registrationDeadline: parsed.registrationDeadline || undefined,
        capacity: typeof parsed.capacity === 'number' ? parsed.capacity : undefined,
        dormitoryOnly: false,
        contactInfo: parsed.contactInfo || undefined,
        uncertainFields: [],
        missingFields: [],
        confidenceScore: 98,
        isSimulated: false,
      };
    } catch (err: unknown) {
      console.error('[GeminiAIAdapter.extractPoster] Extraction error:', err);
      throw new Error(err instanceof Error ? err.message : 'Ekstraksi poster dengan AI gagal.');
    }
  }

  async generateGreeting(context: AIContext): Promise<string> {
    const userName = context.user?.name || context.student?.fullName || 'Pengguna UNKLAB';
    const userRole = context.user?.role || (context.student ? 'student' : 'guest');
    const userRoleLabel = userRole === 'student' ? 'Mahasiswa' : `Administrator (${userRole.replace('_', ' ')})`;
    const firstName = userName.split(' ')[0];

    const systemPrompt =
      `Anda adalah Asisten AI KlabatSync, asisten cerdas resmi kampus Universitas Klabat (UNKLAB).\n` +
      `Profil pengguna saat ini: ${userName} (${userRoleLabel}).\n` +
      `Tugas: Berikan sapaan pembuka yang hangat, ramah, dan santai dalam 1-2 kalimat bahasa Indonesia. Panggil pengguna dengan nama "${firstName}" (atau Kak/Pak ${firstName}). Tawarkan bantuan seputar agenda kampus, kegiatan UNKLAB, atau poin chapel hari ini. JANGAN gunakan nama lain dan jangan gunakan salam kaku seperti template robot.`;

    const prompt = `Berikan salam pembuka singkat yang ramah untuk ${userName}.`;

    try {
      const res = await fetch(
        `/gemini-api/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 150, temperature: 0.75 },
          }),
        }
      );
      if (!res.ok) throw new Error('Greeting generation failed: ' + res.status);
      const data = await res.json();
      const text =
        data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ||
        `Halo ${firstName}! Senang bertemu Anda. Ada yang bisa saya bantu seputar kegiatan atau informasi kampus UNKLAB hari ini?`;
      return text;
    } catch (err) {
      console.warn('[GeminiAIAdapter] Fallback greeting due to error:', err);
      return `Halo ${firstName}! Senang bertemu Anda. Ada yang bisa saya bantu seputar kegiatan atau informasi kampus UNKLAB hari ini?`;
    }
  }
}

// Global active AI Service instance.
// Priority: Gemini (free) -> Backend URL -> offline demo mock.
const geminiApiKey = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
const configuredBackendUrl = (import.meta.env.VITE_BACKEND_API_URL || '').trim();
export const aiService: IAIProvider = geminiApiKey
  ? new GeminiAIAdapter(geminiApiKey)
  : configuredBackendUrl
  ? new BackendAPIAdapter(configuredBackendUrl)
  : new MockDemoAIAdapter();
