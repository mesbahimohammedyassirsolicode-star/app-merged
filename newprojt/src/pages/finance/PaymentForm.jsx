import { useState } from 'react';
import { X, Search, CreditCard, Calendar, DollarSign, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function PaymentForm({ onClose }) {
  const [formData, setFormData] = useState({
    student: '',
    month: 'Mai 2026',
    amount: '',
    method: 'Espèces',
    note: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, we would save the data here
    console.log('Saving payment:', formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div 
        className="w-full max-w-lg bg-card border border-border rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-8 border-b border-border bg-card/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Enregistrer un paiement</h2>
              <p className="text-sm text-muted-foreground">Saisissez les détails du règlement.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-accent transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            {/* Student Search */}
            <div className="space-y-2">
              <label className="text-sm font-semibold ml-1">Élève</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Rechercher l'élève..." 
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  value={formData.student}
                  onChange={(e) => setFormData({...formData, student: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Month */}
              <div className="space-y-2">
                <label className="text-sm font-semibold ml-1">Mois</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <select 
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none"
                    value={formData.month}
                    onChange={(e) => setFormData({...formData, month: e.target.value})}
                  >
                    <option>Janvier 2026</option>
                    <option>Février 2026</option>
                    <option>Mars 2026</option>
                    <option>Avril 2026</option>
                    <option>Mai 2026</option>
                  </select>
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <label className="text-sm font-semibold ml-1">Montant (DH)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    type="number" 
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <label className="text-sm font-semibold ml-1">Mode de paiement</label>
              <div className="grid grid-cols-3 gap-3">
                {['Espèces', 'Virement', 'Chèque'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setFormData({...formData, method})}
                    className={cn(
                      "py-3 rounded-2xl border text-sm font-medium transition-all",
                      formData.method === method 
                        ? "bg-primary/10 border-primary text-primary" 
                        : "bg-background border-border hover:bg-accent"
                    )}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div className="space-y-2">
              <label className="text-sm font-semibold ml-1">Note / Référence</label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <textarea 
                  placeholder="Informations complémentaires..." 
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none min-h-[100px] resize-none"
                  value={formData.note}
                  onChange={(e) => setFormData({...formData, note: e.target.value})}
                ></textarea>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-border font-medium hover:bg-accent transition-colors"
            >
              Annuler
            </button>
            <button 
              type="submit"
              className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
            >
              Confirmer le paiement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
