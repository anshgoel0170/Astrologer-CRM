import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [currentTab, setCurrentTab] = useState('leads'); // tabs: leads | astrologers | bookings | admin
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  
  // Datasets states
  const [leads, setLeads] = useState([]);
  const [astrologers, setAstrologers] = useState([]);
  const [bookings, setBookings] = useState([]);
  
  // Forms States
  const [leadForm, setLeadForm] = useState({ name: '', email: '', phone: '', status: 'New' });
  const [bookingForm, setBookingForm] = useState({ leadId: '', astrologerId: '', scheduledTime: '' });
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  
  // Admin Editing States
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [adminTime, setAdminTime] = useState('');
  const [adminStatus, setAdminStatus] = useState('Scheduled');

  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // Synchronize Master Node Datasets
  const fetchAllData = () => {
    setLoading(true);
    Promise.all([
      fetch('http://localhost:5000/api/leads').then(res => res.json()),
      fetch('http://localhost:5000/api/astrologers').then(res => res.json()),
      fetch('http://localhost:5000/api/bookings').then(res => res.json())
    ])
    .then(([leadsData, astroData, bookingData]) => {
      setLeads(Array.isArray(leadsData) ? leadsData : []);
      setAstrologers(Array.isArray(astroData) ? astroData : []);
      setBookings(Array.isArray(bookingData) ? bookingData : []);
      setLoading(false);
    })
    .catch(err => {
      console.error("Sync failure:", err);
      setApiError("Could not sync datasets from cluster.");
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleAddLead = async (e) => {
    e.preventDefault();
    setApiError(null);

    const emailValue = leadForm.email.trim();
    const phoneValue = leadForm.phone.trim();

    // 1. Strict Javascript Gmail Suffix Verification
    if (!emailValue.endsWith('@gmail.com')) {
      setApiError("Validation Rejected: Only official accounts matching '@gmail.com' are permitted in this CRM pipeline.");
      return;
    }

    // 2. Strict Javascript Exact 10-Digit Mobile Sequence Verification
    if (!/^[0-9]{10}$/.test(phoneValue)) {
      setApiError("Validation Rejected: Phone number must be an exact 10-digit numeric sequence.");
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...leadForm,
          email: emailValue,
          phone: phoneValue
        })
      });
      const newLead = await res.json();
      setLeads([newLead, ...leads]);
      setLeadForm({ name: '', email: '', phone: '', status: 'New' });
    } catch (error) {
      setApiError("Failed to save lead.");
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingForm)
      });
      const targetPayload = await res.json();
      if (!res.ok) { setApiError(targetPayload.error); return; }
      
      setBookings([targetPayload, ...bookings]);
      setBookingForm({ leadId: '', astrologerId: '', scheduledTime: '' });
      alert("🎯 Session Slot Successfully Initialized!");
    } catch (error) {
      setApiError("Booking assignment failed.");
    }
  };

  // Secure Admin Login Verification targeting explicit backend API routing mapping
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setApiError(null);
    try {
      const res = await fetch('http://localhost:5000/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setIsAdminLoggedIn(true);
        setLoginForm({ username: '', password: '' });
        
        // Triggers fresh sync on login check boundary
        Promise.all([
          fetch('http://localhost:5000/api/leads').then(res => res.json()),
          fetch('http://localhost:5000/api/astrologers').then(res => res.json()),
          fetch('http://localhost:5000/api/bookings').then(res => res.json())
        ]).then(([leadsData, astroData, bookingData]) => {
          setLeads(Array.isArray(leadsData) ? leadsData : []);
          setAstrologers(Array.isArray(astroData) ? astroData : []);
          setBookings(Array.isArray(bookingData) ? bookingData : []);
        });

      } else {
        setApiError(data.error || "Authentication failed.");
      }
    } catch (error) {
      setApiError("Authentication router offline. Check backend connection state logs.");
    }
  };

  const handleAdminUpdate = async (e) => {
    e.preventDefault();
    if (!selectedBookingId) return;
    try {
      const res = await fetch(`http://localhost:5000/api/bookings/${selectedBookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledTime: adminTime, status: adminStatus })
      });
      if (!res.ok) throw new Error("Update rejected.");
      alert("🔒 Administrative Parameters Patched Successfully!");
      setSelectedBookingId('');
      fetchAllData();
    } catch (error) {
      setApiError("Administrative update propagation failed.");
    }
  };

  const handleLogoutAdmin = () => {
    setIsAdminLoggedIn(false);
    setCurrentTab('leads');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-950 border-r border-slate-800 p-6 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <span className="text-2xl">🔮</span>
            <div>
              <h1 className="text-lg font-black tracking-wider text-white uppercase">Humara Pandit</h1>
              <p className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase">
                {currentTab === 'admin' ? '🛡️ Admin Workspace' : 'Enterprise CRM'}
              </p>
            </div>
          </div>

          <nav className="space-y-2">
            {currentTab !== 'admin' ? (
              <>
                <button onClick={() => setCurrentTab('leads')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition ${currentTab === 'leads' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}>
                  📊 User Leads Pipeline
                </button>
                <button onClick={() => setCurrentTab('astrologers')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition ${currentTab === 'astrologers' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}>
                  🧑‍⚕️ Astrologer Directory
                </button>
                <button onClick={() => setCurrentTab('bookings')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition ${currentTab === 'bookings' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}>
                  📆 Consultation Matrix
                </button>
                <div className="pt-4 border-t border-slate-800 mt-4">
                  <button onClick={() => setCurrentTab('admin')} className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold border border-amber-600/30 text-amber-500 hover:bg-amber-600 hover:text-white transition">
                    🔒 Gateway: Admin Desk
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="bg-amber-950/40 border border-amber-800/40 p-3 rounded-xl text-xs text-amber-400 font-medium mb-4">
                  Secured Admin Shell Active
                </div>
                <button onClick={handleLogoutAdmin} className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold bg-rose-950 text-rose-400 border border-rose-800/40 hover:bg-rose-900 transition">
                  🚪 Exit Admin Panel
                </button>
              </>
            )}
          </nav>
        </div>
        <div className="mt-8 border-t border-slate-800 pt-4 text-xs text-slate-500">Built for Humara Pandit Placement Evaluation v2.0</div>
      </aside>

      {/* Main Workspace Window */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto">
        {apiError && (
          <div className="mb-6 bg-rose-950/40 border border-rose-800/60 p-4 rounded-xl text-rose-300 text-sm font-medium flex items-start gap-3">
            <span className="text-base mt-0.5">⚠️</span>
            <div>{apiError}</div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-pulse text-slate-400 font-medium tracking-wide">Syncing data streams...</div>
          </div>
        ) : (
          <>
            {/* USER TAB 1: LEADS DIRECTORY */}
            {currentTab === 'leads' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="bg-slate-950 p-6 border border-slate-800 rounded-2xl shadow-xl">
                  <h2 className="text-md font-bold text-white uppercase tracking-wider mb-4">Capture Lead Intent</h2>
                  <form onSubmit={handleAddLead} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">User Full Name</label>
                      <input type="text" required value={leadForm.name} onChange={e => setLeadForm({...leadForm, name: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:border-indigo-500 outline-none" placeholder="User Full Name" />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
                      <input 
                        type="text" 
                        required 
                        value={leadForm.email} 
                        onChange={e => setLeadForm({...leadForm, email: e.target.value})} 
                        className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:border-indigo-500 outline-none" 
                        placeholder="ansh@gmail.com" 
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Phone Number</label>
                      <input 
                        type="tel" 
                        required 
                        maxLength="10"
                        value={leadForm.phone} 
                        onChange={e => setLeadForm({...leadForm, phone: e.target.value})} 
                        className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:border-indigo-500 outline-none" 
                        placeholder="9897654367" 
                      />
                    </div>
                    
                    <button type="submit" className="w-full bg-indigo-600 text-white text-sm font-bold py-3.5 rounded-xl hover:bg-indigo-500 transition">Commit Entry</button>
                  </form>
                </div>
                <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl p-6">
                  <h2 className="text-md font-bold text-white uppercase tracking-wider mb-4">Leads Pipeline</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-widest"><th className="p-4">Client Details</th><th className="p-4">Status</th></tr>
                      </thead>
                      <tbody>
                        {leads.map((lead, idx) => (
                          <tr key={lead._id || idx} className="border-b border-slate-900 hover:bg-slate-900/30 transition">
                            <td className="p-4">
                              <div className="font-bold text-slate-200 text-base">{lead.name}</div>
                              <div className="text-xs text-slate-500 mt-0.5">{lead.email} &bull; {lead.phone}</div>
                            </td>
                            <td className="p-4"><span className="px-2.5 py-1 text-xs font-bold bg-emerald-950 text-emerald-400 rounded-md">{lead.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* USER TAB 2: ASTROLOGER DIRECTORY */}
            {currentTab === 'astrologers' && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-xl p-6">
                <h2 className="text-md font-bold text-white uppercase tracking-wider mb-4">Certified Experts Roster</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {astrologers.map((astro, idx) => (
                    <div key={astro._id || idx} className="p-5 bg-slate-900 border border-slate-800 rounded-xl relative hover:border-slate-700 transition">
                      <span className="absolute top-4 right-4 text-[10px] font-extrabold uppercase px-2 py-0.5 bg-emerald-950 text-emerald-400 rounded">{astro.status}</span>
                      <h3 className="text-lg font-bold text-white mb-1">{astro.name}</h3>
                      <p className="text-xs text-indigo-400 mb-3 font-medium">{astro.specialty.join(', ')}</p>
                      <div className="border-t border-slate-800 pt-3 flex justify-between text-xs text-slate-400">
                        <div>Exp: <span className="text-slate-200 font-bold">{astro.experience} Yrs</span></div>
                        <div>Rate: <span className="text-slate-200 font-bold">₹{astro.hourlyRate}/hr</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* USER TAB 3: BOOKING FORM */}
            {currentTab === 'bookings' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="bg-slate-950 p-6 border border-slate-800 rounded-2xl shadow-xl">
                  <h2 className="text-md font-bold text-white uppercase tracking-wider mb-4">Book New Session</h2>
                  <form onSubmit={handleBookAppointment} className="space-y-4">
                    <select required value={bookingForm.leadId} onChange={e => setBookingForm({...bookingForm, leadId: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white outline-none focus:border-indigo-500">
                      <option value="">-- Choose Lead --</option>
                      {leads.map((lead, i) => <option key={lead._id || i} value={lead._id}>{lead.name}</option>)}
                    </select>
                    <select required value={bookingForm.astrologerId} onChange={e => setBookingForm({...bookingForm, astrologerId: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white outline-none focus:border-indigo-500">
                      <option value="">-- Choose Expert --</option>
                      {astrologers.map((astro, i) => <option key={astro._id || i} value={astro._id}>{astro.name}</option>)}
                    </select>
                    <input type="datetime-local" min={new Date().toISOString().slice(0, 16)} required value={bookingForm.scheduledTime} onChange={e => setBookingForm({...bookingForm, scheduledTime: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white outline-none focus:border-indigo-500" />
                    <button type="submit" className="w-full bg-indigo-600 text-white text-sm font-bold py-3.5 rounded-xl hover:bg-indigo-500 transition">Confirm Booking</button>
                  </form>
                </div>
                <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl p-6">
                  <h2 className="text-md font-bold text-white uppercase tracking-wider mb-4">Live Session Logs</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-widest"><th className="p-4">Target Client</th><th className="p-4">Expert</th><th className="p-4">Timestamp</th></tr>
                      </thead>
                      <tbody>
                        {bookings.map((book, idx) => {
                          const userText = book.leadId?.name || "Anonymous User";
                          const expertText = book.astrologerId?.name || "Awaiting Assignment";
                          const userDate = book.scheduledTime ? new Date(book.scheduledTime).toLocaleString() : "Pending Time";
                          return (
                            <tr key={book._id || idx} className="border-b border-slate-900 hover:bg-slate-900/20 transition">
                              <td className="p-4 font-bold text-slate-200">{userText}</td>
                              <td className="p-4 text-indigo-400 font-medium">{expertText}</td>
                              <td className="p-4 text-slate-400 text-xs">{userDate}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: 🔒 ADMIN CONTROL GATEWAY DESK */}
            {currentTab === 'admin' && (
              <>
                {!isAdminLoggedIn ? (
                  /* SECURE GATEWAY ENCLOSURE LOGIN INTERFACE */
                  <div className="max-w-md mx-auto mt-12 bg-slate-950 border border-amber-900/40 rounded-2xl shadow-2xl p-8">
                    <div className="text-center mb-6">
                      <span className="text-3xl">🛡️</span>
                      <h2 className="text-xl font-bold text-white mt-2">Administrative Verification Required</h2>
                      <p className="text-xs text-slate-500 mt-1">Please authenticate your access tokens to open the control matrix ledger.</p>
                    </div>
                    <form onSubmit={handleAdminLogin} className="space-y-4">
                      <input type="text" required value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:border-amber-500 outline-none" placeholder="Operator Username" />
                      <input type="password" required value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:border-amber-500 outline-none" placeholder="Secret Access Pin" />
                      <button type="submit" className="w-full bg-amber-600 text-white font-bold py-3 rounded-xl hover:bg-amber-500 transition">
                        Verify and Unlock Console
                      </button>
                    </form>
                  </div>
                ) : (
                  /* ENCRYPTED DESK WORKSPACE PANEL */
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fadeIn">
                    <div className="bg-slate-950 p-6 border border-amber-900/40 rounded-2xl shadow-xl">
                      <h2 className="text-md font-bold text-amber-400 uppercase tracking-wider mb-4">Modify Parameters</h2>
                      <form onSubmit={handleAdminUpdate} className="space-y-4">
                        <input type="text" readOnly value={selectedBookingId} className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-500 font-mono outline-none" placeholder="Select row element below" />
                        <input type="datetime-local" min={new Date().toISOString().slice(0, 16)} required value={adminTime} onChange={e => setAdminTime(e.target.value)} className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white outline-none focus:border-amber-500" />
                        <select value={adminStatus} onChange={e => setAdminStatus(e.target.value)} className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white outline-none focus:border-amber-500">
                          <option value="Scheduled">Scheduled (Awaiting Call)</option>
                          <option value="Completed">Completed (Session Done)</option>
                          <option value="Cancelled">Cancelled (Rejected/No Show)</option>
                        </select>
                        <button type="submit" disabled={!selectedBookingId} className="w-full bg-amber-600 disabled:opacity-40 text-white text-sm font-bold py-3.5 rounded-xl hover:bg-amber-500 transition">
                          Propagate Changes Globally
                        </button>
                      </form>
                    </div>

                    <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl p-6">
                      <h2 className="text-md font-bold text-white uppercase tracking-wider mb-1">Master Ledger</h2>
                      <p className="text-xs text-slate-500 mb-4">Select a transaction row to modify its properties.</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                              <th className="p-3.5">Client Lead</th>
                              <th className="p-3.5">Astrologer</th>
                              <th className="p-3.5">Timestamp</th>
                              <th className="p-3.5">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bookings.length === 0 ? (
                              <tr>
                                <td colSpan="4" className="p-8 text-center text-slate-500 text-xs">
                                  No active appointments synchronized inside the cluster routing network.
                                </td>
                              </tr>
                            ) : (
                              bookings.map((book, idx) => {
                                const clientName = book.leadId?.name || "Anonymous Lead";
                                const astrologerName = book.astrologerId?.name || "Awaiting Assignment";
                                
                                let formattedDate = "Pending Timestamp";
                                if (book.scheduledTime) {
                                  try {
                                    formattedDate = new Date(book.scheduledTime).toLocaleString();
                                  } catch (e) {
                                    formattedDate = "Invalid Date Format";
                                  }
                                }

                                return (
                                  <tr 
                                    key={book._id || idx} 
                                    onClick={() => { 
                                      setSelectedBookingId(book._id || ''); 
                                      if(book.scheduledTime) {
                                        try {
                                          setAdminTime(new Date(book.scheduledTime).toISOString().slice(0, 16));
                                        } catch(err) {
                                          setAdminTime('');
                                        }
                                      }
                                      setAdminStatus(book.status || 'Scheduled'); 
                                    }} 
                                    className={`border-b border-slate-900 cursor-pointer transition ${selectedBookingId === book._id ? 'bg-amber-950/20' : 'hover:bg-slate-900/40'}`}
                                  >
                                    <td className="p-3.5 font-bold text-slate-200">{clientName}</td>
                                    <td className="p-3.5 text-indigo-400 font-medium">{astrologerName}</td>
                                    <td className="p-3.5 text-slate-400 text-xs">{formattedDate}</td>
                                    <td className="p-3.5">
                                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${book.status === 'Completed' ? 'bg-emerald-950 text-emerald-400' : book.status === 'Cancelled' ? 'bg-rose-950 text-rose-400' : 'bg-blue-950 text-blue-400'}`}>
                                        {book.status || 'Scheduled'}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}