// src/components/ConfirmationModal.jsx
import { useEffect, useRef } from "react"; // 1. Import useEffect

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    
    const modalRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            modalRef.current?.showModal(); 
        } else {
            modalRef.current?.close();
        }
    }, [isOpen]); 


    return (
        <dialog ref={modalRef} className="modal">
            <div className="modal-box">
                <h3 className="font-bold text-lg">{title}</h3>
                <p className="py-4">{message}</p>
                <div className="modal-action">
                    <button className="btn" onClick={onClose}>Cancelar</button>
                    <button className="btn btn-error" onClick={onConfirm}>Confirmar</button>
                </div>
            </div>
            {/* Clicar fora fecha o modal */}
            <form method="dialog" className="modal-backdrop">
                <button onClick={onClose}>close</button>
            </form>
        </dialog>
    );
};

export default ConfirmationModal;