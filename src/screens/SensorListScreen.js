import { useCallback, useMemo, useRef, useState } from 'react';
import {
  View, Text, FlatList, ActivityIndicator, TouchableOpacity, TextInput,
  ScrollView, StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import SensorCard from '../components/SensorCard';
import { listarSensores } from '../services/sensorService';

const TODOS = 'Todos';
const normalizar = (texto) => String(texto ?? '').trim().toLowerCase();

export default function SensorListScreen({ navigation }) {
  const [sensores, setSensores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState('');
  const [tipoSelecionado, setTipoSelecionado] = useState(TODOS);
  const primeiraVez = useRef(true);

  const carregar = useCallback(async (mostrarSpinner = true) => {
    if (mostrarSpinner) setCarregando(true);
    setErro(null);
    try {
      setSensores(await listarSensores());
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  
  useFocusEffect(
    useCallback(() => {
      carregar(primeiraVez.current);
      primeiraVez.current = false;
    }, [carregar])
  );

  
  const tipos = useMemo(() => {
    const mapa = new Map();
    sensores.forEach((s) => {
      if (s.tipo) mapa.set(normalizar(s.tipo), s.tipo);
    });
    return [...mapa.values()].sort((a, b) => a.localeCompare(b));
  }, [sensores]);

  
  const tipoAtivo = tipos.some((t) => normalizar(t) === normalizar(tipoSelecionado))
    ? tipoSelecionado
    : TODOS;

  const sensoresFiltrados = useMemo(() => {
    const termo = normalizar(busca);
    return sensores.filter((s) => {
      const bateTipo = tipoAtivo === TODOS || normalizar(s.tipo) === normalizar(tipoAtivo);
      const bateBusca =
        !termo || normalizar(s.codigo).includes(termo) || normalizar(s.tipo).includes(termo);
      return bateTipo && bateBusca;
    });
  }, [sensores, busca, tipoAtivo]);

  const filtroAtivo = busca.trim() !== '' || tipoAtivo !== TODOS;

  function limparFiltros() {
    setBusca('');
    setTipoSelecionado(TODOS);
  }

  const mostrarFiltros = !carregando && !erro && sensores.length > 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.botao, carregando && styles.botaoDesabilitado]}
        onPress={() => carregar(true)}
        disabled={carregando}
      >
        <Text style={styles.botaoTexto}>Atualizar lista</Text>
      </TouchableOpacity>

      {mostrarFiltros ? (
        <View style={styles.filtros}>
          <TextInput
            style={styles.busca}
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar por código ou tipo"
            placeholderTextColor="#9aa3ad"
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
          {tipos.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipsScroll}
              contentContainerStyle={styles.chips}
            >
              {[TODOS, ...tipos].map((tipo) => {
                const ativo = tipo === tipoAtivo;
                return (
                  <TouchableOpacity
                    key={tipo}
                    style={[styles.chip, ativo && styles.chipAtivo]}
                    onPress={() => setTipoSelecionado(tipo)}
                  >
                    <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{tipo}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : null}
          <Text style={styles.contagem}>
            {sensoresFiltrados.length} de {sensores.length}{' '}
            {sensores.length === 1 ? 'sensor' : 'sensores'}
          </Text>
        </View>
      ) : null}

      {carregando ? (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.mensagem}>Buscando sensores…</Text>
        </View>
      ) : erro ? (
        <View style={styles.centro}>
          <Text style={styles.titulo}>Não foi possível carregar</Text>
          <Text style={styles.mensagem}>{erro}</Text>
        </View>
      ) : (
        <FlatList
          data={sensoresFiltrados}
          keyExtractor={(item) => item.codigo}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={sensoresFiltrados.length ? styles.lista : styles.centro}
          renderItem={({ item }) => (
            <SensorCard
              sensor={item}
              onPress={() => navigation.navigate('Detalhes', { sensor: item })}
            />
          )}
          ListEmptyComponent={
            filtroAtivo ? (
              <>
                <Text style={styles.titulo}>Nenhum sensor encontrado</Text>
                <Text style={styles.mensagem}>Nenhum sensor corresponde à busca ou ao tipo escolhido.</Text>
                <TouchableOpacity style={styles.botaoSecundario} onPress={limparFiltros}>
                  <Text style={styles.botaoSecundarioTexto}>Limpar filtros</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.titulo}>Nenhum sensor cadastrado</Text>
                <Text style={styles.mensagem}>Cadastre sensores no sistema e atualize a lista.</Text>
              </>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f5f8' },
  botao: {
    backgroundColor: '#2563eb',
    margin: 16,
    marginBottom: 4,
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoDesabilitado: { opacity: 0.5 },
  botaoTexto: { color: '#fff', fontSize: 16, fontWeight: '600' },
  filtros: { paddingHorizontal: 16, paddingTop: 8 },
  busca: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d9dee4',
    minHeight: 46,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#1b2430',
  },
  chipsScroll: { flexGrow: 0, flexShrink: 0, marginTop: 10 },
  chips: { gap: 8, paddingRight: 8 },
  chip: {
    minHeight: 38,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d9dee4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipAtivo: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  chipTexto: { fontSize: 14, fontWeight: '600', color: '#3b4654', textTransform: 'capitalize' },
  chipTextoAtivo: { color: '#fff' },
  contagem: { fontSize: 13, color: '#6b7683', marginTop: 10 },
  lista: { padding: 16 },
  centro: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  titulo: { fontSize: 18, fontWeight: '700', color: '#1b2430', textAlign: 'center' },
  mensagem: { fontSize: 15, color: '#6b7683', marginTop: 8, textAlign: 'center' },
  botaoSecundario: {
    marginTop: 16,
    minHeight: 44,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c5ccd4',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoSecundarioTexto: { fontSize: 15, fontWeight: '600', color: '#1b2430' },
});