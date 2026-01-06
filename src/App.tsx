import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ChurchProvider } from './context/ChurchContext';
import { ProjectorView } from './views/ProjectorView';
import { AdminView } from './views/AdminView';

function App() {
    // Lock body scroll for projector view feel
    useEffect(() => {
        document.body.style.overflow = 'hidden'; // Default for Projector
        if (window.location.pathname.includes('admin')) {
            document.body.style.overflow = 'auto'; // Auto for Admin
        }
    }, []);

    return (
        <ChurchProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<ProjectorView />} />
                    <Route path="/admin" element={<AdminView />} />
                </Routes>
            </BrowserRouter>
        </ChurchProvider>
    );
}

export default App;
