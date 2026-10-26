async function readBody(response) {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
}

export function createMetaClient({ baseUrl, token, fetchImpl = fetch }) {
  const root = String(baseUrl || '').replace(/\/$/, '');

  async function request(path, options = {}) {
    const response = await fetchImpl(`${root}${path}`, {
      method: options.method || 'GET',
      headers: {
        'x-auth': token || '',
        'Content-Type': 'application/json',
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const body = await readBody(response);
    return { ok: response.ok, status: response.status, body };
  }

  function query(path, params) {
    const search = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
    });
    const suffix = search.toString();
    return request(suffix ? `${path}?${suffix}` : path);
  }

  return {
    request,
    configStatus: () => request('/api/meta/config/status'),
    connectionStatus: () => request('/api/meta/connection-status'),
    testAdAccount: () => request('/api/meta/test/ad-account'),
    testPage: () => request('/api/meta/test/page'),
    testPermissions: () => request('/api/meta/test/permissions'),
    syncStatus: () => request('/api/meta/ads/sync-status'),
    ads: params => query('/api/meta/ads', params),
    syncAds: body => request('/api/meta/ads/sync', { method: 'POST', body: body || {} }),
    forms: () => request('/api/meta/forms'),
    mappings: params => query('/api/meta/mappings', params),
    unmapped: params => query('/api/meta/mappings/unmapped', params),
    mapping: id => request(`/api/meta/mappings/${id}`),
    options: () => request('/api/meta/mappings/options'),
    createMapping: body => request('/api/meta/mappings', { method: 'POST', body }),
    updateMapping: (id, body) => request(`/api/meta/mappings/${id}`, { method: 'PATCH', body }),
    deactivateMapping: id => request(`/api/meta/mappings/${id}`, { method: 'DELETE' }),
  };
}
