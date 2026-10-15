import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const BASE_URL = "http://10.137.11.6/api/sensor/status";
const HEADERS = { "Content-Type": "application/json", Accept: "application/json" };

const isOn = (status) => status === 1 || status === true || status === "1";

// ---------- API ----------
async function listarSensores() {
  const res = await fetch(`${BASE_URL}/listar`, { headers: HEADERS });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Erro ao listar sensores");
  return json.data ?? [];
}

async function visualizarSensor(codigo) {
  const res = await fetch(`${BASE_URL}/visualizar/${encodeURIComponent(codigo)}`, {
    headers: HEADERS,
  });
  const json = await res.json();
  if (res.status === 404) throw new Error(json.error || "Sensor não encontrado");
  if (!res.ok) throw new Error(json.error || "Erro ao buscar sensor");
  // O backend pode devolver { data: {...} } ou o status direto na raiz
  const d = json.data && !Array.isArray(json.data) ? json.data : json;
  return { codigo: d.codigo ?? codigo, tipo: d.tipo, status: d.status };
}

async function atualizarStatus(codigo, status) {
  const res = await fetch(`${BASE_URL}/atualizar`, {
    method: "PUT", // se o seu backend usa POST, troque aqui
    headers: HEADERS,
    body: JSON.stringify({ codigo, status }), // status: true | false
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || json.message || "Erro ao atualizar");
  return json;
}

// ---------- Componentes ----------
function SensorCard({ sensor, onToggle, updating }) {
  const on = isOn(sensor.status);
  return (
    <View style={[styles.card, on ? styles.cardOn : styles.cardOff]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.codigo}>{sensor.codigo}</Text>
        {!!sensor.tipo && <Text style={styles.tipo}>{sensor.tipo}</Text>}
        <Text style={[styles.statusText, on ? styles.textOn : styles.textOff]}>
          {on ? "Ligado" : "Desligado"}
        </Text>
      </View>
      {updating ? (
        <ActivityIndicator color={COLORS.primary} />
      ) : (
        <Switch
          value={on}
          onValueChange={(v) => onToggle(sensor, v)}
          trackColor={{ false: "#C9D1D6", true: COLORS.primary }}
          thumbColor="#FFFFFF"
        />
      )}
    </View>
  );
}

export default function App() {
  const [sensores, setSensores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const [busca, setBusca] = useState("");
  const [resultado, setResultado] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [erroBusca, setErroBusca] = useState(null);

  const carregar = useCallback(async () => {
    try {
      setError(null);
      setSensores(await listarSensores());
    } catch (e) {
      setError(e.message === "Network request failed"
        ? "Sem conexão com o servidor. Verifique a rede e o IP da API."
        : e.message);
    }
  }, []);

  useEffect(() => {
    carregar().finally(() => setLoading(false));
  }, [carregar]);

  const onRefresh = async () => {
    setRefreshing(true);
    await carregar();
    setRefreshing(false);
  };

  const buscar = async () => {
    const codigo = busca.trim();
    if (!codigo) return;
    Keyboard.dismiss();
    setBuscando(true);
    setErroBusca(null);
    setResultado(null);
    try {
      setResultado(await visualizarSensor(codigo));
    } catch (e) {
      setErroBusca(e.message);
    } finally {
      setBuscando(false);
    }
  };

  const alternar = async (sensor, novoValor) => {
    setUpdatingId(sensor.codigo);
    try {
      await atualizarStatus(sensor.codigo, novoValor);
      const novoStatus = novoValor ? 1 : 0;
      setSensores((lista) =>
        lista.map((s) => (s.codigo === sensor.codigo ? { ...s, status: novoStatus } : s))
      );
      setResultado((r) => (r && r.codigo === sensor.codigo ? { ...r, status: novoStatus } : r));
    } catch (e) {
      Alert.alert("Não foi possível atualizar", e.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const header = (
    <View>
      <Text style={styles.title}>Sensores</Text>

      <Text style={styles.section}>Buscar sensor</Text>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Código do sensor (ex.: s1)"
          placeholderTextColor="#8A979E"
          value={busca}
          onChangeText={setBusca}
          onSubmitEditing={buscar}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.button} onPress={buscar} disabled={buscando}>
          {buscando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Buscar</Text>
          )}
        </TouchableOpacity>
      </View>

      {erroBusca && <Text style={styles.error}>{erroBusca}</Text>}
      {resultado && (
        <SensorCard
          sensor={resultado}
          onToggle={alternar}
          updating={updatingId === resultado.codigo}
        />
      )}

      <Text style={styles.section}>Todos os sensores</Text>
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Text style={styles.retry}>Tentar de novo</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 80 }} />
      ) : (
        <FlatList
          data={sensores}
          keyExtractor={(item) => String(item.codigo)}
          contentContainerStyle={styles.list}
          ListHeaderComponent={header}
          ListEmptyComponent={
            !error && <Text style={styles.empty}>Nenhum sensor cadastrado ainda.</Text>
          }
          renderItem={({ item }) => (
            <SensorCard sensor={item} onToggle={alternar} updating={updatingId === item.codigo} />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
  );
}

// ---------- Estilos ----------
const COLORS = {
  bg: "#EDF1F3",
  primary: "#0E6B6B",
  on: "#E3F2EF",
  off: "#FFFFFF",
  text: "#1B2A30",
  muted: "#5B6B72",
  danger: "#B3402F",
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  list: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 30, fontWeight: "700", color: COLORS.text, marginBottom: 8, marginTop: 8 },
  section: { fontSize: 16, fontWeight: "600", color: COLORS.muted, marginTop: 20, marginBottom: 10 },
  searchRow: { flexDirection: "row", gap: 10 },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: "#D5DDE1",
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 18,
    justifyContent: "center",
    minWidth: 84,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 16,
    marginTop: 10,
    borderWidth: 1,
  },
  cardOn: { backgroundColor: COLORS.on, borderColor: "#A9D3CB" },
  cardOff: { backgroundColor: COLORS.off, borderColor: "#D5DDE1" },
  codigo: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  tipo: { fontSize: 14, color: COLORS.muted, marginTop: 2 },
  statusText: { fontSize: 13, fontWeight: "600", marginTop: 6 },
  textOn: { color: COLORS.primary },
  textOff: { color: COLORS.muted },
  error: { color: COLORS.danger, marginTop: 10, fontSize: 14 },
  errorBox: { marginBottom: 6 },
  retry: { color: COLORS.primary, fontWeight: "600", marginTop: 6 },
  empty: { textAlign: "center", color: COLORS.muted, marginTop: 30 },
});