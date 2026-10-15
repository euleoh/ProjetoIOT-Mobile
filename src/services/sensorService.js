export const API_BASE_URL = 'http://10.137.11.6/api';
const TIMEOUT_MS = 10000;

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}


const paraBoolean = (valor) => valor === 1 || valor === true || valor === '1';

async function request(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response;
  let texto;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      },
      signal: controller.signal,
    });
    texto = await response.text();
  } catch (e) {
    throw new ApiError(
      e.name === 'AbortError'
        ? 'O servidor demorou demais para responder.'
        : 'Não foi possível conectar ao servidor. Verifique sua rede.'
    );
  } finally {
    clearTimeout(timer);
  }

  let dados = null;
  if (texto) {
    try {
      dados = JSON.parse(texto);
    } catch {
      if (response.ok) throw new ApiError('O servidor enviou uma resposta inválida.');
    }
  }

  if (!response.ok) {
    throw new ApiError(
      dados?.error || dados?.message || `Erro do servidor (HTTP ${response.status}).`,
      response.status
    );
  }
  return dados;
}


export async function listarSensores() {
  const dados = await request('/sensor/status/listar');
  if (!dados || !Array.isArray(dados.data)) {
    throw new ApiError('Formato inesperado na lista de sensores.');
  }
  return dados.data
    .filter((s) => s && s.codigo != null)
    .map((s) => ({
      codigo: String(s.codigo),
      tipo: s.tipo ?? null,
      status: paraBoolean(s.status),
    }));
}


export async function visualizarSensor(codigo) {
  const dados = await request(`/sensor/status/visualizar/${encodeURIComponent(codigo)}`);
  if (!dados || dados.status === undefined) {
    throw new ApiError('Formato inesperado na resposta do sensor.');
  }
  return { codigo, status: paraBoolean(dados.status) };
}

export async function atualizarStatusSensor({ codigo, status }) {
  return request('/sensor/status/atualizar', {
    method: 'PUT',
    body: JSON.stringify({ codigo, status: Boolean(status) }),
  });
}