// src/components/CreateAnnouncementModal.jsx
import { useState, useRef, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext'; // 1. Importar AuthContext
import axiosInstance from '../utils/axiosInstance';
import toast from 'react-hot-toast';

const CreateAnnouncementModal = ({ isOpen, onClose, onAnnouncementCreated }) => {
    const modalRef = useRef(null);
    const { user } = useContext(AuthContext); // 2. Obter o usuário
    
    // 3. Novos estados para segmentação (apenas para staff)
    const [content, setContent] = useState('');
    const [targetUniversity, setTargetUniversity] = useState('');
    const [targetCourse, setTargetCourse] = useState('');

    const isStaff = user?.is_staff;

    useEffect(() => {
        if (isOpen) {
            modalRef.current?.showModal();
        } else {
            modalRef.current?.close();
            // Limpa o formulário ao fechar
            setContent('');
            setTargetUniversity('');
            setTargetCourse('');
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) {
            toast.error("O conteúdo do recado não pode estar vazio.");
            return;
        }

        const payload = { 
            content,
        };

        // 4. Staff envia os alvos; Professor não (backend cuida disso)
        if (isStaff) {
            payload.target_university = targetUniversity;
            payload.target_course = targetCourse;
        }
        
        const promise = axiosInstance.post('/api/announcements/create/', payload);

        toast.promise(promise, {
            loading: 'Publicando recado...',
            success: 'Recado publicado com sucesso!',
            error: 'Não foi possível publicar o recado.'
        });

        try {
            await promise;
            onAnnouncementCreated(); 
            onClose(); 
        } catch (error) {
            console.error("Erro ao criar anúncio:", error.response?.data || error);
        }
    };
    
    // 5. Determina a descrição com base na permissão
    const getDescription = () => {
        if (isStaff) {
            return "Como Admin, você pode enviar recados globais (deixe campos em branco) ou segmentar por universidade/curso.";
        }
        return "Este recado será enviado para todos os alunos da sua universidade e curso cadastrados.";
    };

    return (
        <dialog ref={modalRef} className="modal">
            <div className="modal-box w-11/12 max-w-lg">
                <h3 className="font-bold text-lg">Criar Novo Recado</h3>
                <p className="text-sm text-base-content/60 py-2">
                    {getDescription()}
                </p>
                
                <form onSubmit={handleSubmit} className="py-4 space-y-4">
                    <div className="form-control">
                        <label className="label"><span className="label-text">Conteúdo do Recado</span></label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="textarea textarea-bordered h-40"
                            placeholder="Digite seu recado aqui..."
                            required
                        ></textarea>
                    </div>

                    {/* 6. Campos condicionais para Staff */}
                    {isStaff && (
                        <>
                            <div className="divider text-sm">Segmentação (Admin)</div>
                            <div className="form-control">
                                <label className="label"><span className="label-text">Universidade (Deixe em branco p/ Global)</span></label>
                                <input 
                                    type="text"
                                    value={targetUniversity}
                                    onChange={(e) => setTargetUniversity(e.target.value)}
                                    className="input input-bordered"
                                    placeholder="Ex: SATC"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="label-text">Curso (Deixe em branco p/ Univ. Inteira)</span></label>
                                <input 
                                    type="text"
                                    value={targetCourse}
                                    onChange={(e) => setTargetCourse(e.target.value)}
                                    className="input input-bordered"
                                    placeholder="Ex: Engenharia de Software"
                                />
                            </div>
                        </>
                    )}
                    
                    <div className="modal-action mt-6">
                        <button type="button" className="btn" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary">Publicar</button>
                    </div>
                </form>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button onClick={onClose}>close</button>
            </form>
        </dialog>
    );
};

export default CreateAnnouncementModal;