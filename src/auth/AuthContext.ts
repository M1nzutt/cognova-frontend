import { createContext } from 'react'
import type { AuthSession } from './AuthSession'

export const AuthContext = createContext<AuthSession | null>(null)
