// src/components/ConfirmationModal.jsx
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm mx-4">
                <h3 className="text-xl font-bold mb-4">{title}</h3>
                <p className="text-gray-600 mb-6">{message}</p>
                <div className="flex justify-end gap-4">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
                        Cancelar
                    </button>
                    <button 
                        onClick={onConfirm} 
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                        Confirmar Exclusão
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;