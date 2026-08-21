import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Calendar, LogOut, Shield, User, BookmarkCheck } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, participant, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
              <Calendar className="h-6 w-6" />
              <span>Eventia</span>
            </Link>

            {user && (
              <div className="hidden sm:flex space-x-4">
                <Link
                  to="/"
                  className="text-slate-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Catálogo
                </Link>

                {!isAdmin && (
                  <Link
                    to="/my-registrations"
                    className="text-slate-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <BookmarkCheck className="h-4 w-4" />
                    <span>Mis Inscripciones</span>
                  </Link>
                )}

                {isAdmin && (
                  <Link
                    to="/admin"
                    className="text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Shield className="h-4 w-4" />
                    <span>Panel Administrador</span>
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="hidden md:block text-left text-xs">
                    <p className="font-semibold text-slate-800">
                      {participant?.full_name || user.email}
                    </p>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isAdmin
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {isAdmin ? 'Administrador' : 'Participante'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-slate-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
