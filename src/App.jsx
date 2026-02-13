import React, { useState, useEffect, useRef } from 'react';

/**
 * E-DINAS DPRD – VERSI FINAL DENGAN LOGO GAMBAR
 * - Halaman utama menampilkan logo DPRD (bukan ikon)
 * - Unduh PDF langsung (jsPDF + html2canvas)
 * - Tema aqua dengan glassmorphism & animasi partikel
 * - Database Supabase (tabel laporan)
 */

const SUPABASE_URL = "https://iuwqmkozverovsikchci.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1d3Fta296dmVyb3ZzaWtjaGNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NjI4OTAsImV4cCI6MjA4NjUzODg5MH0.M4rOWoFiJSZzEEo-Oy4GDfXVfsFjpuuEj3yvr78T-hY";

export default function App() {
  // ========== STATE UTAMA ==========
  const [view, setView] = useState('landing');
  const [isReady, setIsReady] = useState(false);
  const [supabase, setSupabase] = useState(null);
  const [connError, setConnError] = useState(null);

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [formData, setFormData] = useState({
    nama: '',
    tanggal_pergi: '',
    tanggal_pulang: '',
    tempat_kegiatan: '',
  });
  const [previewImages, setPreviewImages] = useState([]);

  // Admin state
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [reports, setReports] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  // PDF state
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const pdfContentRef = useRef(null);

  // ========== INISIALISASI ==========
  useEffect(() => {
    // Load Tailwind & Font Awesome
    const tailwind = document.createElement('script');
    tailwind.src = 'https://cdn.tailwindcss.com';
    
    // Load Font Inter & Clash Display
    const fontLink = document.createElement('link');
    fontLink.href = 'https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&f[]=inter@400,500,600,700&display=swap';
    fontLink.rel = 'stylesheet';
    
    const fa = document.createElement('link');
    fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css';
    fa.rel = 'stylesheet';
    
    document.head.append(tailwind, fontLink, fa);

    // Custom styles untuk efek modern
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-20px) rotate(2deg); }
      }
      @keyframes pulse-glow {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }
      @keyframes slideIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-float { animation: float 6s ease-in-out infinite; }
      .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
      .animate-slideIn { animation: slideIn 0.4s ease-out; }
      .glass {
        background: rgba(255, 255, 255, 0.25);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.3);
      }
      .glass-card {
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(20, 184, 166, 0.2);
      }
      .text-gradient {
        background: linear-gradient(135deg, #0f766e 0%, #0891b2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .border-gradient {
        border: double 1px transparent;
        background-image: linear-gradient(white, white), 
          radial-gradient(circle at top left, #14b8a6, #06b6d4);
        background-origin: border-box;
        background-clip: padding-box, border-box;
      }
      .particle {
        position: absolute;
        width: 6px;
        height: 6px;
        background: rgba(20, 184, 166, 0.3);
        border-radius: 50%;
        pointer-events: none;
      }
      @media print {
        .no-print { display: none !important; }
        .print-only { display: block !important; }
      }
    `;
    document.head.appendChild(style);

    // Load Supabase
    const sb = document.createElement('script');
    sb.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    sb.onload = () => {
      try {
        const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        setSupabase(client);
      } catch (err) {
        setConnError('Gagal inisialisasi: ' + err.message);
      } finally {
        setIsReady(true);
      }
    };
    document.head.appendChild(sb);

    // Generate partikel di background
    const particleContainer = document.createElement('div');
    particleContainer.className = 'fixed inset-0 pointer-events-none z-0 overflow-hidden';
    for (let i = 0; i < 30; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      particle.style.animation = `float ${10 + Math.random() * 20}s ease-in-out infinite`;
      particle.style.animationDelay = Math.random() * 5 + 's';
      particle.style.width = Math.random() * 10 + 4 + 'px';
      particle.style.height = particle.style.width;
      particle.style.background = `rgba(${Math.floor(20 + Math.random() * 30)}, ${Math.floor(180 + Math.random() * 30)}, ${Math.floor(160 + Math.random() * 30)}, ${0.1 + Math.random() * 0.2})`;
      particleContainer.appendChild(particle);
    }
    document.body.appendChild(particleContainer);
  }, []);

  // ========== DATABASE ==========
  const fetchReports = async () => {
    if (!supabase) return;
    setIsLoadingReports(true);
    const { data, error } = await supabase
      .from('laporan')
      .select('*')
      .order('created_at', { ascending: false });
    setIsLoadingReports(false);
    if (error) {
      showToast('Gagal mengambil data: ' + error.message, 'error');
    } else {
      setReports(data || []);
    }
  };

  const saveReport = async (payload) => {
    if (!supabase) return { error: { message: 'Database tidak siap' } };
    return await supabase.from('laporan').insert([payload]);
  };

  const deleteReport = async (id) => {
    if (!window.confirm('Hapus laporan ini secara permanen dari database?')) return;
    const { error } = await supabase.from('laporan').delete().eq('id', id);
    if (!error) {
      fetchReports();
      showToast('Laporan berhasil dihapus', 'success');
      if (selectedReport?.id === id) setSelectedReport(null);
    } else {
      showToast('Gagal menghapus data', 'error');
    }
  };

  // ========== HELPER UI ==========
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 4000);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      if (file.size > 1.5 * 1024 * 1024) {
        showToast(`File ${file.name} terlalu besar (maks 1.5MB)`, 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => setPreviewImages((prev) => [...prev, evt.target.result]);
      reader.readAsDataURL(file);
    });
  };

  const removePreviewImage = (index) => {
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFormData({
      nama: '',
      tanggal_pergi: '',
      tanggal_pulang: '',
      tempat_kegiatan: '',
    });
    setPreviewImages([]);
  };

  const isDateValid = () => {
    if (!formData.tanggal_pergi || !formData.tanggal_pulang) return true;
    return formData.tanggal_pergi <= formData.tanggal_pulang;
  };

  // ========== GENERATE PDF (UNDUH LANGSUNG) ==========
  const downloadPdf = async (report) => {
    setIsPdfGenerating(true);
    
    // Load library jsPDF & html2canvas secara dinamis
    if (!window.jspdf) {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    }
    if (!window.html2canvas) {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: 'a4'
    });

    // Buat elemen sementara untuk dirender ke PDF
    const content = document.createElement('div');
    content.style.width = '800px';
    content.style.padding = '40px';
    content.style.background = 'white';
    content.style.fontFamily = 'Inter, sans-serif';
    content.style.color = '#0f172a';
    content.innerHTML = `
      <div style="border-bottom: 4px solid #14b8a6; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <h1 style="font-size: 32px; font-weight: 800; letter-spacing: -0.02em; margin: 0; color: #0f766e;">E-DINAS DPRD</h1>
          <p style="font-size: 11px; font-weight: 600; color: #64748b; margin: 5px 0 0;">SISTEM PELAPORAN PERJALANAN DINAS</p>
        </div>
        <div style="text-align: right; font-size: 10px; color: #94a3b8;">
          <p style="margin: 0;">Dicetak: ${new Date().toLocaleDateString('id-ID')}</p>
          <p style="margin: 5px 0 0; font-family: monospace;">ID: ${report.id}</p>
        </div>
      </div>
      <div style="background: #f0fdfa; padding: 24px; border-radius: 16px; margin-bottom: 30px; border: 1px solid #99f6e4;">
        <h2 style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #0f766e; margin: 0 0 12px;">
          <span style="margin-right: 8px;">👤</span> IDENTITAS PELAPOR
        </h2>
        <p style="font-size: 20px; font-weight: 700; margin: 0; color: #0f172a;">${report.nama}</p>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
        <div style="background: #f8fafc; padding: 20px; border-radius: 12px;">
          <p style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; margin: 0 0 8px;">Tanggal Berangkat</p>
          <p style="font-size: 16px; font-weight: 600; margin: 0; color: #0f172a;">${report.tanggal_pergi}</p>
        </div>
        <div style="background: #f8fafc; padding: 20px; border-radius: 12px;">
          <p style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; margin: 0 0 8px;">Tanggal Kembali</p>
          <p style="font-size: 16px; font-weight: 600; margin: 0; color: #0f172a;">${report.tanggal_pulang}</p>
        </div>
      </div>
      <div style="background: #f8fafc; padding: 24px; border-radius: 16px; margin-bottom: 30px;">
        <h2 style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #0f766e; margin: 0 0 12px;">
          <span style="margin-right: 8px;">📍</span> TEMPAT KEGIATAN & AGENDA
        </h2>
        <p style="font-size: 14px; line-height: 1.6; margin: 0; color: #334155; white-space: pre-wrap;">${report.tempat_kegiatan}</p>
      </div>
      ${report.images && report.images.length > 0 ? `
        <div style="margin-top: 30px;">
          <h2 style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #0f766e; margin: 0 0 16px;">
            <span style="margin-right: 8px;">📸</span> DOKUMENTASI (${report.images.length} FOTO)
          </h2>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
            ${report.images.map(img => `
              <div style="border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
                <img src="${img}" style="width: 100%; height: 100px; object-fit: cover;" />
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      <div style="margin-top: 50px; text-align: center; font-size: 9px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px;">
        <p style="margin: 0;">Dokumen ini diunduh dari sistem E-Dinas DPRD. Data bersumber dari database real-time.</p>
      </div>
    `;

    // Render elemen ke canvas, lalu tambahkan ke PDF
    try {
      document.body.appendChild(content);
      const canvas = await window.html2canvas(content, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: false,
        useCORS: true
      });
      document.body.removeChild(content);

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 800;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
      
      // Unduh PDF
      pdf.save(`Laporan_Dinas_${report.nama.replace(/\s+/g, '_')}_${report.tanggal_pergi}.pdf`);
      showToast('PDF berhasil diunduh', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal membuat PDF: ' + err.message, 'error');
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  // ========== LOADING ==========
  if (!isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-900 via-slate-900 to-cyan-900 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>
        <div className="relative z-10 text-center">
          <div className="relative inline-block animate-float">
            <div className="w-24 h-24 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-[2rem] flex items-center justify-center text-white text-4xl shadow-2xl shadow-teal-500/30">
              <i className="fas fa-landmark"></i>
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/40">
              <i className="fas fa-cloud text-sm"></i>
            </div>
          </div>
          <p className="mt-8 text-sm font-bold tracking-[0.3em] uppercase text-white/70">
            <span className="bg-white/10 px-6 py-3 rounded-full backdrop-blur-sm">Sinkronisasi Database</span>
          </p>
        </div>
      </div>
    );
  }

  // ========== SCREEN: LANDING (dengan GAMBAR logo) ==========
  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex items-center justify-center p-6 font-sans relative overflow-hidden">
        {/* Particle background sudah ditambahkan di body */}
        <div className="absolute inset-0 bg-grid-slate-200 [mask-image:radial-gradient(ellipse_at_center,white,transparent)] opacity-40"></div>
        
        <div className="max-w-4xl text-center relative z-10">
          {/* Logo Gambar (menggantikan ikon fontawesome) */}
          <div className="relative inline-block group">
            <div className="absolute -inset-4 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-[3rem] blur-2xl opacity-30 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative w-32 h-32 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-teal-500/30 rotate-3 transform group-hover:rotate-6 group-hover:scale-110 transition-all duration-500 mx-auto mb-8 bg-white">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/f/fb/Logo_DPRD_Riau.png" 
                alt="Logo DPRD" 
                className="w-full h-full object-contain p-2"
                // Gunakan object-contain agar logo terlihat utuh, atau object-cover jika ingin memenuhi kotak
              />
            </div>
          </div>
          
          <h1 className="text-7xl md:text-8xl font-black mb-6 tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-700 to-cyan-700">
              DINAS LUAR
            </span>
            <span className="block md:inline text-slate-800 ml-0 md:ml-4">
              DPRD RIAU
            </span>
          </h1>
          
          <p className="text-slate-600 mb-12 text-xl font-medium max-w-2xl mx-auto leading-relaxed backdrop-blur-sm bg-white/30 p-6 rounded-3xl border border-white/40 shadow-lg">
            Sistem pelaporan perjalanan dinas luar dprd riau
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button
              onClick={() => setView('form')}
              className="group relative px-12 py-6 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-full font-bold text-lg shadow-2xl shadow-teal-500/30 hover:shadow-teal-500/50 transition-all duration-300 hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 overflow-hidden"
            >
              <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
              <i className="fas fa-pen-to-square relative z-10 group-hover:rotate-12 transition-transform"></i>
              <span className="relative z-10">INPUT LAPORAN</span>
            </button>
            
            <button
              onClick={() => setView('login')}
              className="group px-12 py-6 bg-white/70 backdrop-blur-md text-slate-800 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl border border-white/60 hover:bg-white/90 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <i className="fas fa-lock text-teal-600 group-hover:scale-110 transition-transform"></i>
              PORTAL ADMIN
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========== SCREEN: LOGIN ==========
  if (view === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-10"></div>
        
        <div className="max-w-md w-full glass-card p-10 rounded-[3rem] shadow-2xl border border-white/30 backdrop-blur-xl animate-slideIn">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-3xl flex items-center justify-center text-white text-3xl mx-auto mb-4 shadow-lg shadow-teal-500/30">
              <i className="fas fa-shield-alt"></i>
            </div>
            <h2 className="text-3xl font-black text-slate-800">
              ADMIN <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600">AREA</span>
            </h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">
              Masukkan kredensial
            </p>
          </div>
          
          <div className="space-y-5">
            <div className="relative group">
              <i className="fas fa-user absolute left-5 top-1/2 -translate-y-1/2 text-teal-500 group-focus-within:text-teal-600 transition-colors"></i>
              <input
                type="text"
                id="admUser"
                placeholder="Username"
                className="w-full pl-12 pr-6 py-4 bg-white/70 backdrop-blur-sm rounded-2xl outline-none focus:ring-4 focus:ring-teal-300/50 font-bold text-slate-700 border border-white/40 focus:border-teal-400 transition-all"
                autoFocus
              />
            </div>
            
            <div className="relative group">
              <i className="fas fa-lock absolute left-5 top-1/2 -translate-y-1/2 text-teal-500 group-focus-within:text-teal-600 transition-colors"></i>
              <input
                type="password"
                id="admPass"
                placeholder="Password"
                className="w-full pl-12 pr-6 py-4 bg-white/70 backdrop-blur-sm rounded-2xl outline-none focus:ring-4 focus:ring-teal-300/50 font-bold text-slate-700 border border-white/40 focus:border-teal-400 transition-all"
              />
            </div>
            
            <button
              onClick={() => {
                const user = document.getElementById('admUser').value;
                const pass = document.getElementById('admPass').value;
                if (user === 'admin' && pass === 'admin123') {
                  setIsAdminAuthenticated(true);
                  setView('admin');
                  fetchReports();
                } else {
                  showToast('Username atau password salah', 'error');
                }
              }}
              className="relative w-full py-5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-2xl font-bold shadow-lg shadow-teal-500/30 hover:shadow-xl hover:from-teal-700 hover:to-cyan-700 transition-all active:scale-95 mt-2 overflow-hidden group"
            >
              <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
              <span className="relative z-10">LOGIN</span>
            </button>
            
            <button
              onClick={() => setView('landing')}
              className="w-full py-3 text-xs font-bold text-slate-500 hover:text-teal-600 transition-colors"
            >
              ← KEMBALI KE BERANDA
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========== SCREEN: ADMIN DASHBOARD (FUTURISTIK) ==========
  if (view === 'admin') {
    const filteredReports = reports.filter((r) =>
      r.nama.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 font-sans relative">
        {/* Header Glass */}
        <header className="sticky top-0 z-50 glass-card border-b border-teal-100/50 px-6 md:px-10 py-4 flex flex-wrap items-center justify-between gap-4 no-print">
          <div>
            <h2 className="font-black text-2xl text-slate-800 flex items-center gap-2">
              <i className="fas fa-archive text-teal-600"></i>
              ARSIP <span className="text-gradient underline decoration-wavy underline-offset-4">LAPORAN</span>
            </h2>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2 mt-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              LIVE · SUPABASE
            </p>
          </div>
          
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative group">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-teal-400 group-focus-within:text-teal-600 transition-colors"></i>
              <input
                type="text"
                placeholder="Cari nama anggota..."
                className="pl-11 pr-6 py-3 bg-white/70 backdrop-blur-sm rounded-2xl outline-none focus:ring-4 focus:ring-teal-300/50 text-sm font-bold w-full md:w-64 transition-all border border-white/40 focus:border-teal-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <button
              onClick={() => {
                setIsAdminAuthenticated(false);
                setView('landing');
              }}
              className="w-12 h-12 rounded-2xl bg-red-50/70 backdrop-blur-sm text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm flex items-center justify-center border border-red-100"
              title="Logout"
            >
              <i className="fas fa-power-off"></i>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 relative z-10">
          {/* Statistik Cards 3D */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="group perspective">
              <div className="relative bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-teal-100/50 transition-all duration-500 hover:shadow-2xl hover:shadow-teal-500/20 hover:-translate-y-1 hover:scale-[1.02]">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg shadow-teal-500/30 group-hover:scale-110 transition-transform">
                    <i className="fas fa-file-alt"></i>
                  </div>
                  <div>
                    <p className="text-3xl font-black text-slate-800">{reports.length}</p>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Laporan</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="group perspective">
              <div className="relative bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-teal-100/50 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/20 hover:-translate-y-1 hover:scale-[1.02]">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                    <i className="fas fa-images"></i>
                  </div>
                  <div>
                    <p className="text-3xl font-black text-slate-800">
                      {reports.reduce((acc, r) => acc + (r.images?.length || 0), 0)}
                    </p>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Foto</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="group perspective">
              <div className="relative bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-teal-100/50 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/20 hover:-translate-y-1 hover:scale-[1.02]">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform">
                    <i className="fas fa-calendar-alt"></i>
                  </div>
                  <div>
                    <p className="text-3xl font-black text-slate-800">
                      {new Set(reports.map((r) => r.nama)).size}
                    </p>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Anggota Aktif</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabel Laporan - Glass Effect */}
          <div className="glass-card rounded-[2.5rem] shadow-2xl border border-white/40 overflow-hidden">
            {isLoadingReports ? (
              <div className="flex flex-col items-center justify-center py-32">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <i className="fas fa-database text-teal-600 text-2xl animate-pulse"></i>
                  </div>
                </div>
                <p className="mt-4 text-sm font-bold text-teal-600/70">Memuat laporan...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-teal-500/10 text-[10px] font-black text-teal-700 uppercase tracking-widest">
                    <tr>
                      <th className="p-6 md:p-8">Pelapor</th>
                      <th className="p-6 md:p-8">Agenda & Lokasi</th>
                      <th className="p-6 md:p-8">Waktu Pelaksanaan</th>
                      <th className="p-6 md:p-8">Dokumentasi</th>
                      <th className="p-6 md:p-8 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-teal-100/50">
                    {filteredReports.map((rpt) => (
                      <tr
                        key={rpt.id}
                        onClick={() => setSelectedReport(rpt)}
                        className="group hover:bg-teal-500/5 transition-all cursor-pointer"
                      >
                        <td className="p-6 md:p-8">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white flex items-center justify-center font-black text-sm uppercase shadow-md group-hover:scale-110 transition-transform">
                              {rpt.nama.charAt(0)}
                            </div>
                            <span className="font-bold text-slate-700 text-sm group-hover:text-teal-700 transition-colors">
                              {rpt.nama}
                            </span>
                          </div>
                        </td>
                        <td className="p-6 md:p-8 text-sm text-slate-600 font-medium max-w-xs leading-relaxed">
                          {rpt.tempat_kegiatan}
                        </td>
                        <td className="p-6 md:p-8">
                          <div className="text-[10px] font-black text-teal-600 uppercase bg-teal-100/50 backdrop-blur-sm px-3 py-1.5 rounded-full inline-block">
                            <i className="fas fa-plane-departure mr-1 text-teal-500"></i> {rpt.tanggal_pergi}
                          </div>
                          <div className="text-[10px] text-slate-400 font-bold italic mt-1 ml-1">
                            <i className="fas fa-plane-arrival mr-1 text-emerald-500"></i> {rpt.tanggal_pulang}
                          </div>
                        </td>
                        <td className="p-6 md:p-8">
                          <div className="flex -space-x-2">
                            {rpt.images?.slice(0, 4).map((img, i) => (
                              <div
                                key={i}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedImage(img);
                                }}
                                className="w-9 h-9 rounded-xl border-2 border-white bg-slate-200 overflow-hidden cursor-pointer hover:scale-125 hover:z-20 transition-all shadow-md"
                              >
                                <img src={img} className="w-full h-full object-cover" alt="" />
                              </div>
                            ))}
                            {rpt.images?.length > 4 && (
                              <div className="w-9 h-9 rounded-xl border-2 border-white bg-slate-800/80 backdrop-blur-sm text-white text-[8px] flex items-center justify-center font-black">
                                +{rpt.images.length - 4}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-6 md:p-8 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteReport(rpt.id);
                            }}
                            className="w-10 h-10 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50/70 backdrop-blur-sm transition-all"
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredReports.length === 0 && (
                      <tr>
                        <td colSpan="5" className="p-20 text-center">
                          <div className="flex flex-col items-center">
                            <i className="fas fa-folder-open text-teal-300 text-6xl mb-4"></i>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                              {reports.length === 0 ? 'Database laporan kosong' : 'Tidak ada hasil pencarian'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>

        {/* Modal Detail Laporan */}
        {selectedReport && (
          <ReportDetailModal
            report={selectedReport}
            onClose={() => setSelectedReport(null)}
            onDelete={deleteReport}
            onImageClick={setSelectedImage}
            onDownloadPdf={downloadPdf}
            isPdfGenerating={isPdfGenerating}
          />
        )}

        {/* Modal Preview Gambar */}
        {selectedImage && (
          <div
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 no-print"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-5xl max-h-full animate-slideIn">
              <img
                src={selectedImage}
                className="max-w-full max-h-[90vh] object-contain rounded-3xl shadow-2xl border-4 border-white/20"
                alt="Preview"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-4 -right-4 w-12 h-12 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all flex items-center justify-center text-xl border border-white/40"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ========== SCREEN: FORM INPUT (MODERN) ==========
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-6 flex flex-col items-center font-sans relative">
      <header className="max-w-3xl w-full flex items-center justify-between mb-10 no-print relative z-10">
        <button
          onClick={() => setView('landing')}
          className="group flex items-center gap-2 text-slate-400 font-black text-[10px] tracking-widest uppercase hover:text-teal-600 transition"
        >
          <i className="fas fa-arrow-left group-hover:-translate-x-1 transition-transform"></i>
          Kembali
        </button>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">
          <span className="text-gradient underline decoration-wavy underline-offset-4">Input</span> Laporan
        </h2>
      </header>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!isDateValid()) {
            showToast('Tanggal pulang harus setelah atau sama dengan tanggal pergi', 'error');
            return;
          }
          setIsSubmitting(true);
          const { error } = await saveReport({
            ...formData,
            images: previewImages,
          });
          setIsSubmitting(false);
          if (!error) {
            showToast('Laporan berhasil disimpan ke database!', 'success');
            resetForm();
          } else {
            showToast('Gagal mengirim data: ' + error.message, 'error');
          }
        }}
        className="max-w-3xl w-full glass-card rounded-[3rem] shadow-2xl border border-white/40 p-8 md:p-12 space-y-8 relative z-10"
      >
        {/* Nama */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-teal-700 uppercase tracking-widest ml-2 flex items-center gap-1">
            <i className="fas fa-user-circle"></i> Nama Lengkap
          </label>
          <div className="relative group">
            <i className="fas fa-user absolute left-5 top-1/2 -translate-y-1/2 text-teal-500 group-focus-within:text-teal-600 transition-colors"></i>
            <input
              type="text"
              required
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              className="w-full pl-12 pr-6 py-5 bg-white/70 backdrop-blur-sm rounded-2xl outline-none focus:ring-4 focus:ring-teal-300/50 font-bold text-slate-800 text-lg transition-all border border-white/40 focus:border-teal-400 placeholder:text-slate-400"
              placeholder="Budi Santoso, S.H."
            />
          </div>
        </div>

        {/* Tanggal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-teal-700 uppercase tracking-widest ml-2 flex items-center gap-1">
              <i className="fas fa-calendar-check"></i> Tgl Berangkat
            </label>
            <input
              type="date"
              required
              value={formData.tanggal_pergi}
              onChange={(e) => setFormData({ ...formData, tanggal_pergi: e.target.value })}
              className="w-full px-6 py-5 bg-white/70 backdrop-blur-sm rounded-2xl outline-none focus:ring-4 focus:ring-teal-300/50 font-bold text-slate-700 transition-all border border-white/40 focus:border-teal-400"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-teal-700 uppercase tracking-widest ml-2 flex items-center gap-1">
              <i className="fas fa-calendar-times"></i> Tgl Kembali
            </label>
            <input
              type="date"
              required
              value={formData.tanggal_pulang}
              onChange={(e) => setFormData({ ...formData, tanggal_pulang: e.target.value })}
              className="w-full px-6 py-5 bg-white/70 backdrop-blur-sm rounded-2xl outline-none focus:ring-4 focus:ring-teal-300/50 font-bold text-slate-700 transition-all border border-white/40 focus:border-teal-400"
            />
          </div>
        </div>
        {!isDateValid() && formData.tanggal_pergi && formData.tanggal_pulang && (
          <p className="text-red-500 text-xs font-bold -mt-4 ml-2 flex items-center gap-1">
            <i className="fas fa-exclamation-triangle"></i> Tanggal pulang tidak boleh lebih awal
          </p>
        )}

        {/* Tempat Kegiatan */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-teal-700 uppercase tracking-widest ml-2 flex items-center gap-1">
            <i className="fas fa-map-marked-alt"></i> Agenda & Lokasi
          </label>
          <textarea
            required
            rows="4"
            value={formData.tempat_kegiatan}
            onChange={(e) => setFormData({ ...formData, tempat_kegiatan: e.target.value })}
            className="w-full px-8 py-6 bg-white/70 backdrop-blur-sm rounded-2xl outline-none focus:ring-4 focus:ring-teal-300/50 font-bold resize-none text-slate-700 transition-all border border-white/40 focus:border-teal-400 placeholder:text-slate-400 leading-relaxed"
            placeholder="Contoh: Konsultasi penyusunan Perda di Dinas Pendidikan Provinsi Jawa Barat"
          />
        </div>

        {/* Upload Foto */}
        <div className="space-y-4">
          <label className="text-[10px] font-black text-teal-700 uppercase tracking-widest ml-2 flex items-center gap-1">
            <i className="fas fa-camera"></i> Dokumentasi Foto
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
            {previewImages.map((src, i) => (
              <div
                key={i}
                className="relative aspect-square rounded-2xl bg-slate-100 overflow-hidden group border-2 border-white shadow-md"
              >
                <img src={src} className="w-full h-full object-cover" alt="preview" />
                <button
                  type="button"
                  onClick={() => removePreviewImage(i)}
                  className="absolute inset-0 bg-red-600/80 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xl backdrop-blur-sm"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            ))}
            <label className="aspect-square rounded-2xl border-4 border-dashed border-teal-300/50 flex flex-col items-center justify-center text-teal-500 hover:border-teal-500 hover:text-teal-600 hover:bg-teal-50/50 transition-all cursor-pointer bg-white/30 backdrop-blur-sm">
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <i className="fas fa-plus text-2xl mb-1"></i>
              <span className="text-[8px] font-black uppercase tracking-tighter">Tambah</span>
            </label>
          </div>
          <p className="text-[10px] text-slate-500 ml-2 flex items-center gap-1">
            <i className="fas fa-info-circle"></i> Maksimal 1.5MB per file
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="relative w-full py-6 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-2xl font-black shadow-2xl shadow-teal-500/30 hover:shadow-teal-500/50 transition-all duration-300 hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-4 text-lg disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden group"
        >
          <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
          {isSubmitting ? (
            <>
              <i className="fas fa-spinner animate-spin relative z-10"></i>
              <span className="relative z-10">MENYIMPAN...</span>
            </>
          ) : (
            <>
              <i className="fas fa-cloud-upload-alt relative z-10 group-hover:scale-110 transition-transform"></i>
              <span className="relative z-10">SIMPAN LAPORAN DINAS</span>
            </>
          )}
        </button>
      </form>

      {/* Toast Notification */}
      <ToastNotification toast={toast} setToast={setToast} />
    </div>
  );
}

// ========== MODAL DETAIL LAPORAN (DENGAN TOMBOL UNDUH PDF) ==========
const ReportDetailModal = ({ report, onClose, onDelete, onImageClick, onDownloadPdf, isPdfGenerating }) => {
  if (!report) return null;

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-md flex items-center justify-center p-4 no-print"
      onClick={onClose}
    >
      <div
        className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/40 animate-slideIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-md p-6 border-b border-teal-100/50 flex flex-wrap items-center justify-between gap-4 rounded-t-[2.5rem]">
          <h3 className="font-black text-2xl text-slate-800 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white flex items-center justify-center text-sm shadow-lg">
              {report.nama.charAt(0)}
            </span>
            {report.nama}
          </h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onDownloadPdf(report)}
              disabled={isPdfGenerating}
              className="px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isPdfGenerating ? (
                <>
                  <i className="fas fa-spinner animate-spin"></i>
                  <span>Menyiapkan PDF...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-file-pdf"></i>
                  <span>Unduh PDF</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 transition-all flex items-center justify-center text-slate-600"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-8 space-y-8">
          {/* Informasi Kegiatan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-teal-50/70 backdrop-blur-sm p-6 rounded-3xl border border-teal-100">
              <div className="flex items-center gap-3 text-teal-700 mb-4">
                <i className="fas fa-calendar-alt text-xl"></i>
                <h4 className="font-black text-sm uppercase tracking-wider">Periode Dinas</h4>
              </div>
              <p className="text-slate-700 font-bold">
                <span className="text-teal-600">Berangkat:</span> {report.tanggal_pergi}
              </p>
              <p className="text-slate-700 font-bold">
                <span className="text-teal-600">Kembali:</span> {report.tanggal_pulang}
              </p>
            </div>
            <div className="bg-slate-50/70 backdrop-blur-sm p-6 rounded-3xl border border-slate-200">
              <div className="flex items-center gap-3 text-teal-700 mb-4">
                <i className="fas fa-map-pin text-xl"></i>
                <h4 className="font-black text-sm uppercase tracking-wider">Tempat Kegiatan</h4>
              </div>
              <p className="text-slate-700 font-bold leading-relaxed whitespace-pre-wrap">
                {report.tempat_kegiatan}
              </p>
            </div>
          </div>

          {/* Dokumentasi Foto */}
          {report.images && report.images.length > 0 && (
            <div>
              <div className="flex items-center gap-3 text-teal-700 mb-4">
                <i className="fas fa-images text-xl"></i>
                <h4 className="font-black text-sm uppercase tracking-wider">
                  Dokumentasi ({report.images.length} foto)
                </h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {report.images.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => onImageClick(img)}
                    className="aspect-square rounded-2xl overflow-hidden cursor-pointer hover:scale-105 transition-transform shadow-md border-2 border-white"
                  >
                    <img src={img} className="w-full h-full object-cover" alt={`dokumentasi-${idx}`} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata & Hapus */}
          <div className="flex flex-wrap items-center justify-between pt-4 border-t border-teal-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              ID Laporan: {report.id} • Dilaporkan: {new Date(report.created_at).toLocaleString('id-ID')}
            </p>
            <button
              onClick={() => {
                onDelete(report.id);
                onClose();
              }}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-bold text-sm transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <i className="fas fa-trash-alt"></i>
              Hapus Laporan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ========== TOAST NOTIFICATION ==========
const ToastNotification = ({ toast, setToast }) => {
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, setToast]);

  if (!toast.show) return null;

  const bgColor = toast.type === 'success' 
    ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
    : 'bg-gradient-to-r from-red-500 to-rose-500';
  const icon = toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] animate-slideIn no-print">
      <div className={`${bgColor} text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 font-bold text-sm backdrop-blur-sm border border-white/20`}>
        <i className={`fas ${icon} text-lg`}></i>
        <span>{toast.message}</span>
        <button 
          onClick={() => setToast((prev) => ({ ...prev, show: false }))} 
          className="ml-2 hover:text-white/80 transition-colors"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  );
};