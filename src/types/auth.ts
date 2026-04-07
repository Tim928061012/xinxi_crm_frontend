export interface User {
  id: string
  username: string
  name: string
  role: string
  email: string
  avatar?: string
  firstName?: string
  lastName?: string
  account?: string
  roleDisplayName?: string
}

export interface LoginForm {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}
