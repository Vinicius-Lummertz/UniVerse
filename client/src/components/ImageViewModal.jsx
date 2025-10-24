// src/components/ImageViewModal.jsx
import { useEffect, useRef } from 'react';

const ImageViewModal = ({ isOpen, onClose, imageUrl }) => {
    const modalRef = useRef(null);

    useEffect(() => {
        if (isOpen) modalRef.current?.showModal();
        else modalRef.current?.close();
    }, [isOpen]);

    return (
        <dialog ref={modalRef} className="modal">
            <div className="modal-box p-0">
                <img src={imageUrl} alt="Profile" className="w-full h-auto" />
            </div>
            <form method="dialog" className="modal-backdrop">
                <button onClick={onClose}>close</button>
            </form>
        </dialog>
    );
};
export default ImageViewModal;