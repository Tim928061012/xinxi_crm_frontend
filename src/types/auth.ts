export interface User {
  id: string
  username: string
  name: string
  role: 'user' | 'admin'
  email: string
  avatar?: string
  firstName?: string
  lastName?: string
  account?: string
}

export interface LoginForm {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}
