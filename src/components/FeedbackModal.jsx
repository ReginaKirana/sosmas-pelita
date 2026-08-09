import { X, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

export default function FeedbackModal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info', // 'success', 'error', 'confirm', 'warning', 'info'
  onConfirm,
  confirmText = 'Ya',
  cancelText = 'Batal'
}) {
  if (!isOpen) return null;

  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return { icon: <CheckCircle className="w-8 h-8 text-emerald-500" />, bg: 'bg-emerald-100', text: 'text-emerald-800' };
      case 'error':
        return { icon: <XCircle className="w-8 h-8 text-red-500" />, bg: 'bg-red-100', text: 'text-red-800' };
      case 'confirm':
      case 'warning':
        return { icon: <AlertTriangle className="w-8 h-8 text-amber-500" />, bg: 'bg-amber-100', text: 'text-amber-800' };
      default:
        return { icon: <Info className="w-8 h-8 text-sky-500" />, bg: 'bg-sky-100', text: 'text-sky-800' };
    }
  };

  const { icon, bg, text } = getIconAndColor();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-3xl w-full max-w-sm flex flex-col shadow-2xl overflow-hidden transform transition-all">
        
        <div className="p-6 flex flex-col items-center text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${bg}`}>
            {icon}
          </div>
          
          <h3 className={`text-xl font-black mb-2 ${text}`}>{title}</h3>
          <p className="text-sm text-slate-500 mb-6">{message}</p>

          <div className="flex items-center gap-3 w-full">
            {type === 'confirm' && (
              <button 
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
              >
                {cancelText}
              </button>
            )}
            <button 
              onClick={onConfirm || onClose}
              className={`flex-1 py-3 px-4 font-bold rounded-xl text-white shadow-md transition-colors ${
                type === 'confirm' || type === 'error' ? 'bg-red-500 hover:bg-red-600' :
                type === 'success' ? 'bg-emerald-500 hover:bg-emerald-600' :
                'bg-sky-500 hover:bg-sky-600'
              }`}
            >
              {type === 'confirm' ? confirmText : 'Oke'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
