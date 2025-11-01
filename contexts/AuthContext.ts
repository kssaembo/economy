import React from 'react';
import { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  login: (user: User) => void;
  logout: () => void;
}

export const AuthContext = React.createContext<AuthContextType>({
  currentUser: null,
  login: () => {},
  logout: () => {},
});