// Every request includes credentials so the httpOnly session cookie set by
// /api/auth/login and /api/auth/register is sent back on subsequent calls.
async function request(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  let body = null
  try {
    body = await res.json()
  } catch {
    // no JSON body (e.g. 204 on logout) — that's fine
  }

  if (!res.ok) {
    const message = body?.error || `Request failed (${res.status})`
    throw new Error(message)
  }

  return body
}

export const api = {
  register: (data) =>
    request('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  me: () => request('/api/auth/me', { method: 'GET' }),
}
