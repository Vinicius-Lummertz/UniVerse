import { useState, useContext, useEffect, useRef } from 'react';
import AuthContext from '../context/AuthContext';
import axiosInstance from '../utils/axiosInstance';
import toast from 'react-hot-toast';

const OnboardingModal = () => {
    // Controlamos o estado local do formulário
    const [universidade, setUniversidade] = useState('');
    const [curso, setCurso] = useState('');
    const [atletica, setAtletica] = useState('');
    const [anoInicio, setAnoInicio] = useState('');
    const [joinCommunity, setJoinCommunity] = useState(true); // Checkbox

    // Pegamos os estados globais do AuthContext
    const { user, setUser, showOnboardingModal, setShowOnboardingModal } = useContext(AuthContext);
    const modalRef = useRef(null);

    // Controla a abertura/fechamento do modal do DaisyUI
    useEffect(() => {
        if (showOnboardingModal) {
            modalRef.current?.showModal();
        } else {
            modalRef.current?.close();
        }
    }, [showOnboardingModal]);

    // Lógica para pular o onboarding
    const handleSkip = async () => {
        const promise = axiosInstance.patch(`/api/profile/`, {
            onboarding_complete: true 
        });
        
        toast.promise(promise, {
            loading: 'Salvando...',
            success: 'Você pode completar seu perfil mais tarde.',
            error: 'Erro ao pular.'
        });

        try {
            const response = await promise;
            // Atualiza o usuário no contexto global
            const updatedUser = { ...user, profile: response.data };
            setUser(updatedUser);
            localStorage.setItem('userInfo', JSON.stringify(updatedUser));
            setShowOnboardingModal(false); // Fecha o modal
        } catch (error) {
            console.error("Erro ao pular onboarding:", error);
        }
    };

    // Lógica principal de submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const profileData = {
            universidade,
            curso,
            atletica,
            ano_inicio: anoInicio ? parseInt(anoInicio) : null,
            onboarding_complete: true,
        };

        // 1. Atualiza o perfil
        const profilePromise = axiosInstance.patch(`/api/profile/`, profileData);
        toast.promise(profilePromise, {
            loading: 'Atualizando seu perfil...',
            success: 'Perfil atualizado com sucesso!',
            error: 'Erro ao atualizar o perfil.'
        });

        try {
            const profileResponse = await profilePromise;
            const updatedUser = { ...user, profile: profileResponse.data };
            setUser(updatedUser); // Atualiza o contexto
            localStorage.setItem('userInfo', JSON.stringify(updatedUser));
            
            // 2. Tenta entrar na comunidade (se marcado)
            if (joinCommunity && curso) {
                try {
                    // 2a. Encontra a comunidade
                    const findCommunityRes = await axiosInstance.get(`/api/communities/find-by-course/?course=${curso}`);
                    
                    if (findCommunityRes.data && findCommunityRes.data.length > 0) {
                        const communityId = findCommunityRes.data[0].id;
                        // 2b. Entra na comunidade
                        await axiosInstance.post(`/api/communities/${communityId}/join/`);
                        toast.success(`Você entrou na comunidade ${findCommunityRes.data[0].name}!`);
                    } else {
                        toast.error(`Não encontramos uma comunidade para o curso ${curso} ainda.`);
                    }
                } catch (communityError) {
                    console.error("Erro ao entrar na comunidade:", communityError);
                    toast.error("Não foi possível entrar na comunidade automaticamente.");
                }
            }
            
            setShowOnboardingModal(false); // Fecha o modal
            
        } catch (error) {
            console.error("Erro no onboarding:", error);
        }
    };

    return (
        // Usamos modal-open para forçar a abertura
        // Adicionamos 'cursor-auto' para que o clique fora (do backdrop) não feche
        <dialog ref={modalRef} className="modal modal-open cursor-auto">
            <div className="modal-box w-11/12 max-w-lg">
                <h3 className="font-bold text-2xl text-center">Bem-vindo ao UniVerse!</h3>
                <p className="py-4 text-center">Complete seu perfil para encontrar colegas, participar de comunidades e ter uma experiência completa.</p>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="form-control">
                        <label className="label"><span className="label-text">Sua Universidade</span></label>
                        <input type="text" value={universidade} onChange={(e) => setUniversidade(e.target.value)} className="input input-bordered" required />
                    </div>
                    
                    <div className="form-control">
                        <label className="label"><span className="label-text">Seu Curso</span></label>
                        <input type="text" value={curso} onChange={(e) => setCurso(e.target.value)} className="input input-bordered" required />
                    </div>
                    
                    <div className="flex gap-4">
                        <div className="form-control w-1/2">
                            <label className="label"><span className="label-text">Sua Atlética (Opcional)</span></label>
                            <input type="text" value={atletica} onChange={(e) => setAtletica(e.target.value)} className="input input-bordered" />
                        </div>
                        <div className="form-control w-1/2">
                            <label className="label"><span className="label-text">Ano de Início (Opcional)</span></label>
                            <input type="number" min="1950" max="2100" value={anoInicio} onChange={(e) => setAnoInicio(e.target.value)} className="input input-bordered" />
                        </div>
                    </div>

                    <div className="form-control mt-4">
                        <label className="label cursor-pointer">
                            <span className="label-text">Entrar automaticamente na comunidade do meu curso</span> 
                            <input type="checkbox" checked={joinCommunity} onChange={(e) => setJoinCommunity(e.target.checked)} className="checkbox checkbox-primary" />
                        </label>
                    </div>

                    <div className="modal-action flex flex-col items-center mt-6">
                        <button type="submit" className="btn btn-primary w-full">Começar a explorar!</button>
                        {/* O link "Pular" que não tem cara de link */}
                        <a onClick={handleSkip} className="text-xs text-base-content/50 hover:underline cursor-pointer mt-3">
                            Pular por enquanto
                        </a>
                    </div>
                </form>
            </div>
            {/* O backdrop NÃO tem o form method="dialog" para impedir o fechamento */}
            <div className="modal-backdrop bg-black bg-opacity-30"></div> 
        </dialog>
    );
};

export default OnboardingModal;