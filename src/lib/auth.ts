import { getItem, setItem, removeItem } from "./storage";

const STRAPI_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";

export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: string;
  avatar: string;
}

const CURRENT_USER_KEY = "ampligame_current_user";
const JWT_KEY = "ampligame_jwt";

// ==========================================
// Получение текущего пользователя
// ==========================================
export function getCurrentUser(): User | null {
  const raw = getItem(CURRENT_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ==========================================
// Регистрация через Strapi
// ==========================================
export async function register(
  email: string,
  username: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    const res = await fetch(`${STRAPI_URL}/api/auth/local/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      // Strapi возвращает ошибку в data.error.message
      return {
        success: false,
        error: data.error?.message || "Ошибка регистрации",
      };
    }

    // Strapi возвращает { jwt, user }
    const user: User = {
      id: String(data.user.id),
      email: data.user.email,
      username: data.user.username,
      createdAt: data.user.createdAt,
      avatar: "/img/default-avatar.svg",
    };

    // Сохраняем JWT и пользователя
    setItem(JWT_KEY, data.jwt);
    setItem(CURRENT_USER_KEY, JSON.stringify(user));

    return { success: true, user };
  } catch (error) {
    return {
      success: false,
      error: "Ошибка сети. Проверьте подключение к Strapi.",
    };
  }
}

// ==========================================
// Вход через Strapi
// ==========================================
export async function login(
  identifier: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: User }> {
  if (!identifier || !password) {
    return { success: false, error: "Заполните все поля" };
  }

  try {
    const res = await fetch(`${STRAPI_URL}/api/auth/local`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.error?.message || "Неверный email или пароль",
      };
    }

    const user: User = {
      id: String(data.user.id),
      email: data.user.email,
      username: data.user.username,
      createdAt: data.user.createdAt,
      avatar: "/img/default-avatar.svg",
    };

    setItem(JWT_KEY, data.jwt);
    setItem(CURRENT_USER_KEY, JSON.stringify(user));

    return { success: true, user };
  } catch (error) {
    return {
      success: false,
      error: "Ошибка сети. Проверьте подключение к Strapi.",
    };
  }
}

// ==========================================
// Выход
// ==========================================
export function logout(): void {
  removeItem(CURRENT_USER_KEY);
  removeItem(JWT_KEY);
}

// ==========================================
// Получение JWT (для защищённых запросов)
// ==========================================
export function getJWT(): string | null {
  return getItem(JWT_KEY);
}
