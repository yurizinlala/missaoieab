import React, { ReactNode } from 'react';
import { Settings } from 'lucide-react';

interface ProjectorLayoutProps {
    children: ReactNode;
    onOpenAdmin: () => void;
}

export const ProjectorLayout: React.FC<ProjectorLayoutProps> = ({ children, onOpenAdmin }) => {
    return (
        <div className="relative w-screen h-screen overflow-hidden bg-deep-blue text-white flex flex-col items-center justify-center">
            {/* Background World Map */}
            <div className="absolute inset-0 pointer-events-none opacity-20 flex items-center justify-center z-0">
                <img src="/assets/world.svg" alt="World Map" className="w-[80vw] h-auto object-contain" />
            </div>

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            />

            {/* Main Content Area */}
            <main className="relative z-10 w-full h-full flex flex-col items-center justify-center p-8">
                {children}
            </main>

            {/* Footer Logo - Bottom Left */}
            <div className="absolute bottom-6 left-8 z-20">
                <img src="/assets/ieablogo.png" alt="IEAB Logo" className="h-10 object-contain drop-shadow-lg opacity-60 hover:opacity-100 transition-opacity" />
            </div>

            {/* Hidden Admin Trigger */}
            <div className="absolute bottom-4 right-4 z-50 opacity-10 hover:opacity-100 transition-opacity">
                <button
                    onClick={onOpenAdmin}
                    className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white"
                >
                    <Settings size={20} />
                </button>
            </div>
        </div>
    );
};
