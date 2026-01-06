
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { WineEntry, AIWineResponse, WineType } from './types';
import WineCard from './components/WineCard';
import WineDetailForm from './components/WineDetailForm';
import { analyzeWineLabel } from './services/geminiService';

type SortKey = 'name' | 'maker' | 'year' | 'price' | 'createdAt';
type SortOrder = 'asc' | 'desc';

const App: React.FC = () => {
  const [wines, setWines] = useState<WineEntry[]>([]);
  const [view, setView] = useState<'list' | 'add' | 'edit'>('list');
  const [showTrash, setShowTrash] = useState(false);
  const [editingWine, setEditingWine] = useState<WineEntry | null>(null);
  const [tempAIResult, setTempAIResult] = useState<Partial<WineEntry> | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Processing...");
  const [error, setError] = useState<{title: string, message: string} | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [stagedImages, setStagedImages] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  
  const isLoaded = useRef(false);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('vinoscan_cellar');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const migrated = parsed.map((w: any) => ({
          ...w,
          imageUrls: w.imageUrls || (w.imageUrl ? [w.imageUrl] : [])
        }));
        setWines(migrated);
      } catch (e) {
        setError({
          title: "Storage Error",
          message: "Could not load your saved cellar. Data might be corrupted."
        });
      }
    }
    isLoaded.current = true;
  }, []);

  useEffect(() => {
    if (isLoaded.current) {
      try {
        localStorage.setItem('vinoscan_cellar', JSON.stringify(wines));
      } catch (e: any) {
        if (e.name === 'QuotaExceededError') {
          setError({
            title: "Storage Full",
            message: "Your cellar is too large for local browser storage. Try removing some photos or entries."
          });
        }
      }
    }
  }, [wines]);

  // Filtering & Sorting Logic
  const processedWines = useMemo(() => {
    let result = wines.filter(w => showTrash ? !!w.deletedAt : !w.deletedAt);

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(w => 
        w.name.toLowerCase().includes(term) || 
        w.maker.toLowerCase().includes(term) || 
        w.notes.toLowerCase().includes(term) ||
        w.binNumber.toLowerCase().includes(term)
      );
    }

    result.sort((a, b) => {
      let valA: any = a[sortKey];
      let valB: any = b[sortKey];

      if (sortKey === 'price') {
        valA = parseFloat(String(valA).replace(/[^0-9.]/g, '')) || 0;
        valB = parseFloat(String(valB).replace(/[^0-9.]/g, '')) || 0;
      } else if (sortKey === 'year') {
        valA = parseInt(String(valA).replace(/[^0-9]/g, '')) || 0;
        valB = parseInt(String(valB).replace(/[^0-9]/g, '')) || 0;
      } else if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [wines, searchTerm, sortKey, sortOrder, showTrash]);

  const trashCount = useMemo(() => wines.filter(w => !!w.deletedAt).length, [wines]);

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 800; 
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => resolve(base64Str);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    setLoadingText("Enhancing Image...");

    const compressedImages: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      if (files.length > 1) {
        setLoadingText(`Sharpening image ${i + 1} of ${files.length}...`);
      }

      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      
      const compressed = await compressImage(base64);
      compressedImages.push(compressed);
    }

    if (compressedImages.length === 0) {
      setLoading(false);
      return;
    }

    if (view === 'add' || view === 'edit') {
      setLoadingText("Updating Gallery...");
      if (view === 'add' && tempAIResult) {
        setTempAIResult(prev => ({ ...prev, imageUrls: [...(prev?.imageUrls || []), ...compressedImages] }));
      } else if (view === 'edit' && editingWine) {
        setEditingWine(prev => prev ? ({ ...prev, imageUrls: [...prev.imageUrls, ...compressedImages] }) : null);
      }
      setTimeout(() => setLoading(false), 300);
    } else {
      setStagedImages(prev => [...prev, ...compressedImages]);
      setLoading(false);
    }
    
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const processImageImmediately = async (base64: string) => {
    setLoading(true);
    setLoadingText("Analyzing Label...");
    setError(null);
    try {
      const aiData = await analyzeWineLabel(base64);
      
      setLoadingText("Populating Fields...");
      await new Promise(r => setTimeout(r, 600));

      setTempAIResult({
        ...aiData,
        imageUrls: [base64],
        id: crypto.randomUUID(),
        createdAt: Date.now()
      });
      setStagedImages([]);
      setView('add');
    } catch (err: any) {
      setError({ 
        title: "Analysis Failed", 
        message: err.message || "We couldn't read the wine label clearly." 
      });
    } finally {
      setLoading(false);
      setShowCamera(false);
    }
  };

  const processStagedImages = async (useAI: boolean) => {
    if (stagedImages.length === 0) return;

    if (!useAI) {
      setTempAIResult({
        imageUrls: stagedImages,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        name: "",
        maker: "",
        year: "",
        type: WineType.RED,
        description: ""
      });
      setStagedImages([]);
      setView('add');
      return;
    }

    setLoading(true);
    setLoadingText("Analyzing Label...");
    setError(null);
    try {
      const aiData = await analyzeWineLabel(stagedImages[0]);
      
      setLoadingText("Populating Fields...");
      await new Promise(r => setTimeout(r, 600));

      setTempAIResult({
        ...aiData,
        imageUrls: stagedImages,
        id: crypto.randomUUID(),
        createdAt: Date.now()
      });
      setStagedImages([]);
      setView('add');
    } catch (err: any) {
      setError({ 
        title: "Analysis Failed", 
        message: err.message || "We couldn't read the wine label clearly." 
      });
    } finally {
      setLoading(false);
      setShowCamera(false);
    }
  };

  const removeStagedImage = (index: number) => {
    setStagedImages(prev => prev.filter((_, i) => i !== index));
  };

  const startCamera = async () => {
    setError(null);
    try {
      setShowCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      setShowCamera(false);
      const msg = err.name === 'NotAllowedError' ? "Permission denied. Check settings." : "Camera in use or not found.";
      setError({ title: "Camera Error", message: msg });
    }
  };

  const capturePhoto = async (isQuickScan: boolean = false) => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      const base64 = canvas.toDataURL('image/jpeg');
      
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      
      setLoading(true);
      setLoadingText("Enhancing Image...");
      const compressed = await compressImage(base64);
      
      if (isQuickScan) {
        await processImageImmediately(compressed);
        return;
      }

      if (view === 'add' || view === 'edit') {
        setLoadingText("Updating Gallery...");
        if (view === 'add' && tempAIResult) {
          setTempAIResult(prev => ({ ...prev, imageUrls: [...(prev?.imageUrls || []), compressed] }));
        } else if (view === 'edit' && editingWine) {
          setEditingWine(prev => prev ? ({ ...prev, imageUrls: [...prev.imageUrls, compressed] }) : null);
        }
        setTimeout(() => {
          setLoading(false);
          setShowCamera(false);
        }, 300);
      } else {
        setStagedImages(prev => [...prev, compressed]);
        setLoading(false);
        setShowCamera(false);
      }
    }
  };

  const closeCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const saveWine = (wine: WineEntry) => {
    setLoading(true);
    setLoadingText("Recording to Cellar...");
    
    setTimeout(() => {
      try {
        if (editingWine) {
          setWines(prev => prev.map(w => w.id === wine.id ? wine : w));
        } else {
          setWines(prev => [wine, ...prev]);
        }
        
        setView('list');
        setEditingWine(null);
        setTempAIResult(null);
        setLoading(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } catch (err: any) {
        setLoading(false);
        setError({ title: "Save Failed", message: "Could not persist wine data." });
      }
    }, 400);
  };

  const deleteWine = (id: string) => {
    setWines(prev => prev.map(w => w.id === id ? { ...w, deletedAt: Date.now() } : w));
  };

  const restoreWine = (id: string) => {
    setWines(prev => prev.map(w => w.id === id ? { ...w, deletedAt: undefined } : w));
  };

  const permanentDeleteWine = (id: string) => {
    if (confirm("This will permanently erase this bottle. Continue?")) {
      setWines(prev => prev.filter(w => w.id !== id));
    }
  };

  const exportToCSV = () => {
    if (wines.length === 0) return;
    const headers = ["Name", "Maker", "Year", "Type", "Price", "Bin", "Notes"];
    const rows = wines.filter(w => !w.deletedAt).map(w => [w.name, w.maker, w.year, w.type, w.price, w.binNumber, w.notes]);
    const csvContent = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cellar_inventory.csv";
    link.click();
  };

  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setLoadingText("Parsing Inventory...");

    try {
      const text = await file.text();
      const rows: string[][] = [];
      let currentRow: string[] = [];
      let currentCell = "";
      let inQuotes = false;

      // Robust CSV parsing state machine
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          currentRow.push(currentCell.trim());
          currentCell = "";
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
          if (currentCell || currentRow.length > 0) {
            currentRow.push(currentCell.trim());
            rows.push(currentRow);
            currentRow = [];
            currentCell = "";
          }
          // Handle CRLF
          if (char === '\r' && text[i+1] === '\n') i++;
        } else {
          currentCell += char;
        }
      }
      if (currentCell || currentRow.length > 0) {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
      }

      if (rows.length < 2) throw new Error("CSV is empty or missing headers.");

      const headers = rows[0].map(h => h.toLowerCase());
      const newWines: WineEntry[] = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length === 0 || (row.length === 1 && !row[0])) continue;

        const getVal = (possibleHeaders: string[]) => {
          const index = headers.findIndex(h => possibleHeaders.includes(h));
          return index !== -1 ? row[index] : "";
        };

        const wine: WineEntry = {
          id: crypto.randomUUID(),
          imageUrls: [],
          name: getVal(["name", "wine", "wine name"]) || "Imported Wine",
          maker: getVal(["maker", "winery", "producer"]) || "Unknown",
          year: getVal(["year", "vintage"]) || "",
          type: (Object.values(WineType).includes(getVal(["type", "category"]) as WineType) 
                ? getVal(["type", "category"]) as WineType 
                : WineType.RED),
          price: getVal(["price", "cost", "value"]) || "",
          description: "",
          binNumber: getVal(["bin", "bin number", "location"]) || "",
          notes: getVal(["notes", "personal notes", "comment"]) || "",
          customFields: [],
          createdAt: Date.now() + i 
        };
        newWines.push(wine);
      }

      setWines(prev => [...newWines, ...prev]);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      setError({ title: "Import Failed", message: err.message || "Failed to parse CSV file." });
    } finally {
      setLoading(false);
      if (csvInputRef.current) csvInputRef.current.value = "";
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="min-h-screen pb-12">
      <nav className="wine-gradient text-white py-6 px-4 shadow-lg sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setView('list'); setShowTrash(false); setSearchTerm(""); }}>
            <div className="bg-white/10 p-2 rounded-lg">
              <svg className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
            </div>
            <div><h1 className="text-2xl font-bold tracking-tight">VinoScan</h1><p className="text-[10px] uppercase tracking-widest opacity-70">AI Cellar Master</p></div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowTrash(!showTrash)} 
              className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border transition-all ${showTrash ? 'bg-white text-stone-900 border-white' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}
              title={showTrash ? "Back to Cellar" : "View Trash Bin"}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {showTrash ? "Exit Trash" : "Trash"}
              {trashCount > 0 && !showTrash && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-stone-900">
                  {trashCount}
                </span>
              )}
            </button>
            <div className="h-6 w-px bg-white/20 mx-1 hidden sm:block"></div>
            <button 
              onClick={() => csvInputRef.current?.click()} 
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs border border-white/20 transition-colors"
            >
              Import CSV
            </button>
            <button 
              onClick={exportToCSV} 
              className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs border border-white/20 transition-colors"
            >
              Export CSV
            </button>
            <input type="file" ref={csvInputRef} className="hidden" accept=".csv" onChange={handleCSVImport} />
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 mt-8">
        {showSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            <span className="font-medium">Cellar inventory updated successfully.</span>
          </div>
        )}

        {view === 'list' && stagedImages.length > 0 && (
          <div className="mb-8 bg-white p-6 rounded-2xl shadow-xl border-2 border-stone-800 ring-4 ring-stone-100 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-stone-900 serif">Review Uploads</h2>
                <p className="text-stone-500 text-sm">Review photos before analysis</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  onClick={() => setStagedImages([])} 
                  className="flex-1 sm:flex-none px-4 py-2 text-stone-600 font-medium hover:text-stone-900 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => processStagedImages(false)} 
                  className="flex-1 sm:flex-none px-4 py-2 bg-stone-100 text-stone-800 font-bold rounded-lg hover:bg-stone-200 transition-colors"
                >
                  Add Manually
                </button>
                <button 
                  onClick={() => processStagedImages(true)} 
                  className="flex-1 sm:flex-none px-6 py-2 wine-gradient text-white font-bold rounded-lg shadow-lg hover:opacity-90 transition-all"
                >
                  Analyze with AI
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              {stagedImages.map((img, idx) => (
                <div key={idx} className="relative group w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden border border-stone-200 shadow-sm">
                  <img src={img} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="staged label" />
                  <button 
                    onClick={() => removeStagedImage(idx)}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  {idx === 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-stone-900/60 text-white text-[10px] py-1 text-center font-bold uppercase tracking-widest backdrop-blur-sm">Primary</div>
                  )}
                </div>
              ))}
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 sm:w-32 sm:h-32 border-2 border-dashed border-stone-200 rounded-xl flex flex-col items-center justify-center text-stone-400 hover:border-stone-400 hover:text-stone-600 transition-all"
              >
                <svg className="h-8 w-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                <span className="text-[10px] font-bold uppercase">Add More</span>
              </button>
            </div>
          </div>
        )}

        {view === 'list' ? (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-bold text-stone-900 mb-1">{showTrash ? "Trash Bin" : "Inventory"}</h2>
                  <p className="text-stone-500 text-sm">{processedWines.length} Bottles {showTrash ? "deleted" : "total"}</p>
                </div>
                {!showTrash && (
                  <div className="flex gap-3">
                    <button onClick={startCamera} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 wine-gradient text-white font-bold rounded-xl shadow-md hover:scale-[1.02] active:scale-95 transition-all">Scan Bottle</button>
                    <button onClick={() => fileInputRef.current?.click()} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-stone-100 text-stone-800 font-bold rounded-xl border border-stone-200 hover:bg-stone-200 transition-colors">Upload Photos</button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileUpload} />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2">
                <div className="md:col-span-7 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-stone-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Search name, maker, or notes..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-stone-200 rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-stone-800 focus:bg-white transition-all"
                  />
                  {searchTerm && (
                    <button 
                    onClick={() => setSearchTerm("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600"
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
                
                <div className="md:col-span-5 flex gap-2">
                  <div className="relative flex-1">
                    <select 
                      value={sortKey}
                      onChange={(e) => setSortKey(e.target.value as SortKey)}
                      className="w-full pl-3 pr-8 py-2 border border-stone-200 rounded-lg bg-stone-50 text-xs focus:outline-none focus:ring-2 focus:ring-stone-800 appearance-none transition-all"
                    >
                      <option value="createdAt">Date Added</option>
                      <option value="name">Name</option>
                      <option value="maker">Maker</option>
                      <option value="year">Vintage Year</option>
                      <option value="price">Price</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-stone-400">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <button 
                    onClick={toggleSortOrder}
                    className="px-3 py-2 border border-stone-200 rounded-lg bg-stone-50 hover:bg-stone-100 transition-colors flex items-center justify-center text-stone-600"
                    title={sortOrder === 'asc' ? "Sort Ascending" : "Sort Descending"}
                  >
                    {sortOrder === 'asc' ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4 4m0 0l4-4m-4 4v-12" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3 shadow-sm">
                <div className="flex-1"><h3 className="font-bold text-sm uppercase">{error.title}</h3><p className="text-sm">{error.message}</p></div>
                <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600"><svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
              </div>
            )}

            {processedWines.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {processedWines.map(wine => (
                  <WineCard 
                    key={wine.id} 
                    wine={wine} 
                    onEdit={(w) => { setEditingWine(w); setView('edit'); }} 
                    onDelete={deleteWine} 
                    onRestore={restoreWine}
                    onPermanentDelete={permanentDeleteWine}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-stone-400 bg-white rounded-3xl border-2 border-dashed border-stone-200 text-center px-4">
                {searchTerm ? (
                  <>
                    <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mb-4">
                      <svg className="h-8 w-8 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-stone-900 mb-1">No matches found</h3>
                    <p className="max-w-xs text-sm">Try searching for something else or clear the filter.</p>
                    <button onClick={() => setSearchTerm("")} className="mt-4 text-stone-600 font-semibold underline underline-offset-4 hover:text-stone-900 transition-all">Clear Search</button>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-stone-900 mb-1">{showTrash ? "Trash is empty" : "Cellar is empty"}</h3>
                    <p className="text-sm">{showTrash ? "Deleted bottles will appear here." : "Upload or scan bottle labels to begin."}</p>
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl border border-stone-100 overflow-hidden mb-12">
            <div className="wine-gradient p-6 text-white flex justify-between items-center">
              <div><h2 className="text-2xl font-bold serif">{view === 'add' ? 'New Entry' : 'Edit Entry'}</h2><p className="opacity-80 text-sm">Review or enhance details below.</p></div>
              <button onClick={() => setView('list')} className="p-2 hover:bg-white/10 rounded-full transition-colors"><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-8">
              <WineDetailForm 
                initialData={view === 'edit' ? editingWine! : tempAIResult!} 
                onSave={saveWine}
                onCancel={() => { setView('list'); setEditingWine(null); setTempAIResult(null); }}
                onAddMorePhotos={startCamera}
              />
            </div>
          </div>
        )}
      </main>

      {loading && (
        <div className="fixed inset-0 bg-stone-900/90 backdrop-blur-xl z-[100] flex flex-col items-center justify-center text-white p-6 text-center">
          <div className="relative mb-12">
            <div className="w-24 h-24 border-4 border-stone-800 border-t-white rounded-full animate-spin shadow-[0_0_50px_-12px_rgba(255,255,255,0.3)]"></div>
          </div>
          <div className="space-y-3">
            <p className="text-3xl font-bold tracking-tight drop-shadow-sm serif italic">{loadingText}</p>
            <div className="flex justify-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce"></div>
            </div>
          </div>
        </div>
      )}

      {showCamera && (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col">
          <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover" />
          <div className="absolute top-6 right-6">
            <button onClick={closeCamera} className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-colors hover:bg-white/30">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <div className="p-8 pb-12 flex justify-center items-center gap-12 bg-gradient-to-t from-black/80 to-transparent backdrop-blur-sm">
            <button 
              onClick={() => capturePhoto(true)} 
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-14 h-14 bg-amber-500 rounded-full flex items-center justify-center text-white shadow-lg group-hover:bg-amber-600 transition-all group-active:scale-90 border-2 border-white/20">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-[10px] text-white font-bold uppercase tracking-widest">Quick Scan</span>
            </button>

            <button 
              onClick={() => capturePhoto(false)} 
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-20 h-20 bg-white rounded-full border-4 border-stone-600 p-1 shadow-2xl transition-all active:scale-90 hover:scale-105">
                <div className="w-full h-full bg-white rounded-full border-2 border-stone-900"></div>
              </div>
              <span className="text-[10px] text-white font-bold uppercase tracking-widest">Snap & Batch</span>
            </button>

            <div className="w-14 h-14 opacity-0 pointer-events-none"></div> 
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
