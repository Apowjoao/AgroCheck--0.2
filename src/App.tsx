/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Tractor, 
  MapPin, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Camera, 
  ArrowRight, 
  ArrowLeft, 
  Check,
  X,
  Loader2,
  Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FARMS_DATA } from './data';

type Step = 'HOME' | 'FARM' | 'TRACTOR' | 'FORM' | 'SUCCESS';

interface Farm {
  id: number;
  nome: string;
}

interface TractorData {
  id: number;
  nome: string;
  fazenda_id: number;
}

const CHECKLIST_ITEMS = [
  "Nível de Óleo Hidráulico",
  "Vazamento de Óleo",
  "Mangueiras em Geral",
  "Nível de Óleo da Transmissão",
  "Acionamento do Braço Oscilante",
  "Freio Estacionário",
  "Cinto de Segurança",
  "Proteção da TDP",
  "Possui Trincas",
  "Pontos de Lubrificação",
  "Calibração dos Pneus Dianteiros",
  "Conservação dos Pneus Dianteiros",
  "Calibração dos Pneus Traseiros",
  "Conservação dos Pneus Traseiros",
  "Nível de Óleo do Motor",
  "Vazamento no Motor",
  "Nível de Água do Radiador",
  "Correias do Motor",
  "Assento ou Poltrona",
  "Limpeza",
  "Limpador de Para-brisa",
  "Luzes do Painel",
  "Manômetro de Temperatura",
  "Manômetro do Óleo do Motor",
  "Retrovisores"
];

type ChecklistStatus = 'C' | 'NC' | 'N/A';

export default function App() {
  const [step, setStep] = useState<Step>('HOME');
  const [farms, setFarms] = useState<Farm[]>([]);
  const [tractors, setTractors] = useState<TractorData[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [selectedTractor, setSelectedTractor] = useState<TractorData | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [operador, setOperador] = useState('');
  const [horimetro, setHorimetro] = useState('');
  const [respostas, setRespostas] = useState<Record<string, ChecklistStatus>>(
    CHECKLIST_ITEMS.reduce((acc, item) => ({ ...acc, [item]: 'C' }), {})
  );
  const [observacoes, setObservacoes] = useState('');
  const [foto, setFoto] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingChecklists();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    fetchFarms();
    updatePendingCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updatePendingCount = () => {
    const pending = JSON.parse(localStorage.getItem('pending_checklists') || '[]');
    setPendingSyncCount(pending.length);
  };

  const fetchFarms = async () => {
    setLoading(true);
    try {
      if (navigator.onLine) {
        try {
          const res = await fetch('/api/fazendas');
          if (!res.ok) throw new Error();
          const data = await res.json();
          setFarms(data);
          localStorage.setItem('cached_farms', JSON.stringify(data));
        } catch {
          // Fallback to local data if API fails
          setFarms(FARMS_DATA);
        }
      } else {
        const cached = localStorage.getItem('cached_farms');
        if (cached) setFarms(JSON.parse(cached));
        else setFarms(FARMS_DATA);
      }
    } catch (err) {
      console.error(err);
      setFarms(FARMS_DATA);
    } finally {
      setLoading(false);
    }
  };

  const fetchTractors = async (farmId: number) => {
    setLoading(true);
    try {
      if (navigator.onLine) {
        try {
          const res = await fetch(`/api/tratores/${farmId}`);
          if (!res.ok) throw new Error();
          const data = await res.json();
          setTractors(data);
          localStorage.setItem(`cached_tractors_${farmId}`, JSON.stringify(data));
        } catch {
          const farm = FARMS_DATA.find(f => f.id === farmId);
          if (farm) setTractors(farm.tratores);
        }
      } else {
        const cached = localStorage.getItem(`cached_tractors_${farmId}`);
        if (cached) setTractors(JSON.parse(cached));
        else {
          const farm = FARMS_DATA.find(f => f.id === farmId);
          if (farm) setTractors(farm.tratores);
        }
      }
    } catch (err) {
      console.error(err);
      const farm = FARMS_DATA.find(f => f.id === farmId);
      if (farm) setTractors(farm.tratores);
    } finally {
      setLoading(false);
    }
  };

  const syncPendingChecklists = async () => {
    const pending = JSON.parse(localStorage.getItem('pending_checklists') || '[]');
    if (pending.length === 0) return;

    console.log(`Syncing ${pending.length} pending checklists...`);
    const remaining = [];

    for (const item of pending) {
      try {
        const res = await fetch('/api/checklist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
        if (!res.ok) throw new Error('Sync failed');
      } catch (err) {
        console.error('Failed to sync item:', err);
        remaining.push(item);
      }
    }

    localStorage.setItem('pending_checklists', JSON.stringify(remaining));
    updatePendingCount();
  };

  const handleStart = () => setStep('FARM');

  const handleSelectFarm = (farm: Farm) => {
    setSelectedFarm(farm);
    fetchTractors(farm.id);
    setStep('TRACTOR');
  };

  const handleSelectTractor = (tractor: TractorData) => {
    setSelectedTractor(tractor);
    setStep('FORM');
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Não foi possível acessar a câmera.");
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.7);
        setFoto(dataUrl);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const isProblematic = Object.values(respostas).some(status => status === 'NC');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!operador || !horimetro) {
      alert("Por favor, preencha o nome do operador e o horímetro.");
      return;
    }

    if (isProblematic && !foto) {
      alert("Uma foto é obrigatória quando há itens não conformes (NC).");
      return;
    }

    setSubmitting(true);
    const status_geral = isProblematic ? 'URGENTE' : 'NORMAL';

    const payload = {
      operador,
      trator_id: selectedTractor?.id,
      horimetro,
      respostas,
      observacoes,
      foto,
      status_geral,
      fazenda_nome: selectedFarm?.nome,
      trator_nome: selectedTractor?.nome
    };

    try {
      if (navigator.onLine) {
        const res = await fetch('/api/checklist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          setStep('SUCCESS');
        } else {
          throw new Error('Server error');
        }
      } else {
        // Save to offline queue
        const pending = JSON.parse(localStorage.getItem('pending_checklists') || '[]');
        pending.push(payload);
        localStorage.setItem('pending_checklists', JSON.stringify(pending));
        updatePendingCount();
        setStep('SUCCESS');
      }
    } catch (err) {
      console.error(err);
      // Fallback to offline queue on network failure
      const pending = JSON.parse(localStorage.getItem('pending_checklists') || '[]');
      pending.push(payload);
      localStorage.setItem('pending_checklists', JSON.stringify(pending));
      updatePendingCount();
      setStep('SUCCESS');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep('HOME');
    setSelectedFarm(null);
    setSelectedTractor(null);
    setOperador('');
    setHorimetro('');
    setRespostas(CHECKLIST_ITEMS.reduce((acc, item) => ({ ...acc, [item]: 'C' }), {}));
    setObservacoes('');
    setFoto(null);
  };

  const handleStatusChange = (item: string, status: ChecklistStatus) => {
    setRespostas(prev => ({ ...prev, [item]: status }));
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 font-sans pb-10">
      {/* Header */}
      <header className="bg-emerald-700 text-white p-4 shadow-md flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Tractor className="w-8 h-8" />
          <h1 className="text-xl font-bold tracking-tight">AgroCheck</h1>
        </div>
        <div className="flex items-center gap-3">
          {!isOnline && (
            <div className="flex items-center gap-1 bg-amber-500 px-2 py-1 rounded text-xs font-bold animate-pulse">
              OFFLINE
            </div>
          )}
          {pendingSyncCount > 0 && (
            <div className="bg-blue-500 px-2 py-1 rounded text-xs font-bold">
              {pendingSyncCount} PENDENTE(S)
            </div>
          )}
          {step !== 'HOME' && step !== 'SUCCESS' && (
            <button 
              onClick={() => setStep('HOME')}
              className="p-2 hover:bg-emerald-600 rounded-full transition-colors"
            >
              <Home className="w-6 h-6" />
            </button>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 mt-4">
        <AnimatePresence mode="wait">
          {step === 'HOME' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="w-32 h-32 bg-emerald-100 rounded-full flex items-center justify-center mb-8 shadow-inner">
                <Tractor className="w-16 h-16 text-emerald-700" />
              </div>
              <h2 className="text-3xl font-extrabold mb-4 text-stone-800">Bem-vindo ao AgroCheck</h2>
              <p className="text-stone-600 mb-10 text-lg">Realize o checklist diário do seu trator de forma simples e rápida.</p>
              
              <button 
                onClick={handleStart}
                className="w-full py-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-2xl font-bold shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
              >
                NOVO CHECK-LIST
                <ArrowRight className="w-8 h-8" />
              </button>
            </motion.div>
          )}

          {step === 'FARM' && (
            <motion.div 
              key="farm"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
            >
              <div className="flex items-center gap-2 mb-6">
                <button onClick={() => setStep('HOME')} className="p-2 -ml-2"><ArrowLeft /></button>
                <h2 className="text-2xl font-bold">Selecione a Fazenda</h2>
              </div>
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin w-10 h-10 text-emerald-600" /></div>
              ) : (
                <div className="grid gap-4">
                  {farms.map(farm => (
                    <button
                      key={farm.id}
                      onClick={() => handleSelectFarm(farm)}
                      className="p-6 bg-white rounded-2xl shadow-sm border border-stone-200 flex items-center justify-between hover:border-emerald-500 hover:bg-emerald-50 active:scale-95 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 rounded-xl text-emerald-700">
                          <MapPin />
                        </div>
                        <span className="text-xl font-semibold">{farm.nome}</span>
                      </div>
                      <ArrowRight className="text-stone-400" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {step === 'TRACTOR' && (
            <motion.div 
              key="tractor"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
            >
              <div className="flex items-center gap-2 mb-6">
                <button onClick={() => setStep('FARM')} className="p-2 -ml-2"><ArrowLeft /></button>
                <div>
                  <h2 className="text-2xl font-bold">Selecione o Trator</h2>
                  <p className="text-stone-500">{selectedFarm?.nome}</p>
                </div>
              </div>
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin w-10 h-10 text-emerald-600" /></div>
              ) : (
                <div className="grid gap-4">
                  {tractors.map(tractor => (
                    <button
                      key={tractor.id}
                      onClick={() => handleSelectTractor(tractor)}
                      className="p-6 bg-white rounded-2xl shadow-sm border border-stone-200 flex items-center justify-between hover:border-emerald-500 hover:bg-emerald-50 active:scale-95 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 rounded-xl text-emerald-700">
                          <Tractor />
                        </div>
                        <span className="text-xl font-semibold">{tractor.nome}</span>
                      </div>
                      <ArrowRight className="text-stone-400" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {step === 'FORM' && (
            <motion.div 
              key="form"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
            >
              <div className="flex items-center gap-2 mb-6">
                <button onClick={() => setStep('TRACTOR')} className="p-2 -ml-2"><ArrowLeft /></button>
                <div>
                  <h2 className="text-2xl font-bold">Check-list Diário</h2>
                  <p className="text-stone-500">{selectedTractor?.nome} • {selectedFarm?.nome}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-stone-600 mb-1 flex items-center gap-2">
                      <User className="w-4 h-4" /> NOME DO OPERADOR
                    </label>
                    <input 
                      type="text" 
                      required
                      value={operador}
                      onChange={(e) => setOperador(e.target.value)}
                      placeholder="Ex: João Silva"
                      className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl text-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-stone-600 mb-1 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> HORÍMETRO ATUAL
                    </label>
                    <input 
                      type="number" 
                      required
                      value={horimetro}
                      onChange={(e) => setHorimetro(e.target.value)}
                      placeholder="0000.0"
                      className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl text-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                {/* Checklist Items */}
                <div className="space-y-4">
                  <h3 className="font-bold text-stone-500 px-2 uppercase tracking-wider text-sm">Itens de Inspeção</h3>
                  
                  {CHECKLIST_ITEMS.map(item => (
                    <div 
                      key={item} 
                      className={`bg-white p-5 rounded-2xl shadow-sm transition-all border-2 ${
                        respostas[item] === 'NC' ? 'border-red-500 bg-red-50/30' : 'border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-bold text-stone-800">{item}</p>
                        {respostas[item] === 'NC' && (
                          <AlertCircle className="w-5 h-5 text-red-600 animate-pulse" />
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {(['C', 'NC', 'N/A'] as ChecklistStatus[]).map(status => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => handleStatusChange(item, status)}
                            className={`py-3 rounded-xl font-bold transition-all ${
                              respostas[item] === status 
                                ? status === 'C' ? 'bg-emerald-600 text-white shadow-lg' : status === 'NC' ? 'bg-red-600 text-white shadow-lg' : 'bg-stone-500 text-white shadow-lg'
                                : 'bg-stone-100 text-stone-500'
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Observations */}
                <div className="bg-white p-6 rounded-2xl shadow-sm">
                  <label className="block text-sm font-bold text-stone-600 mb-2">OBSERVAÇÕES</label>
                  <textarea 
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    rows={3}
                    className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Descreva qualquer detalhe adicional..."
                  />
                </div>

                {/* Photo Upload */}
                <div className="bg-white p-6 rounded-2xl shadow-sm">
                  <label className="block text-sm font-bold text-stone-600 mb-3">
                    FOTO DO TRATOR {isProblematic && <span className="text-red-500">(OBRIGATÓRIO)</span>}
                  </label>
                  
                  {foto ? (
                    <div className="relative rounded-xl overflow-hidden shadow-md">
                      <img src={foto} alt="Checklist" className="w-full h-48 object-cover" />
                      <button 
                        type="button"
                        onClick={() => setFoto(null)}
                        className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full shadow-lg"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={startCamera}
                      className="w-full py-10 border-2 border-dashed border-stone-300 rounded-xl flex flex-col items-center justify-center gap-2 text-stone-500 hover:bg-stone-50 transition-colors"
                    >
                      <Camera className="w-10 h-10" />
                      <span className="font-bold">TIRAR FOTO</span>
                    </button>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full py-5 rounded-2xl text-xl font-bold shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 ${
                      isProblematic 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {submitting ? (
                      <Loader2 className="animate-spin w-6 h-6" />
                    ) : (
                      <>
                        FINALIZAR CHECK-LIST
                        <CheckCircle2 className="w-6 h-6" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {step === 'SUCCESS' && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 text-emerald-600">
                <Check className="w-12 h-12" strokeWidth={3} />
              </div>
              <h2 className="text-3xl font-bold mb-2">Enviado com Sucesso!</h2>
              <p className="text-stone-600 mb-10">O relatório foi salvo e enviado por e-mail.</p>
              
              <button 
                onClick={resetForm}
                className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xl font-bold shadow-lg transition-all active:scale-95"
              >
                VOLTAR AO INÍCIO
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          <div className="flex-1 relative">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            <button 
              onClick={stopCamera}
              className="absolute top-6 right-6 p-3 bg-white/20 backdrop-blur-md text-white rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-10 flex justify-center bg-black">
            <button 
              onClick={capturePhoto}
              className="w-20 h-20 bg-white rounded-full border-8 border-stone-300 active:scale-90 transition-transform"
            />
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* Status Bar for Form */}
      {step === 'FORM' && (
        <div className={`fixed bottom-0 left-0 right-0 p-3 text-center font-bold text-white shadow-2xl transition-colors ${
          isProblematic ? 'bg-red-600' : 'bg-emerald-600'
        }`}>
          STATUS GERAL: {isProblematic ? 'URGENTE' : 'NORMAL'}
        </div>
      )}
    </div>
  );
}
