import React, { useState } from 'react';
import { Navbar, Footer } from './components';
import { Home, Login, Register, Dashboard, CreateMeeting, UploadMeeting, Transcript, Summary, ActionItems } from './pages';

const App = () => {
    const [currentPage, setCurrentPage] = useState('home');

    const renderPage = () => {
        switch (currentPage) {
            case 'home':
                return <Home />;
            case 'login':
                return <Login />;
            case 'register':
                return <Register />;
            case 'dashboard':
                return <Dashboard />;
            case 'createMeeting':
                return <CreateMeeting />;
            case 'uploadMeeting':
                return <UploadMeeting />;
            case 'transcript':
                return <Transcript />;
            case 'summary':
                return <Summary />;
            case 'actionItems':
                return <ActionItems />;
            default:
                return <Home />;
        }
    };

    return (
        <div>
            <Navbar setCurrentPage={setCurrentPage} />
            <main>{renderPage()}</main>
            <Footer />
        </div>
    );
};

export default App;