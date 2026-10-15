import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, Switch, ActivityIndicator, TouchableOpacity, StyleSheet,
} from 'react-native';
import { visualizarSensor, atualizarStatusSensor } from '../services/sensorService';

export default function SensorDetailsScreen({ route, navigation }) {
  const { sensor: sensorInicial } = route.params;
  const { codigo, tipo } = sensorInicial;

  const [status, setStatus] = useState(sensorInicial.status);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const dados = await visualizarSensor(codigo);
      setStatus(dados.status);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, [codigo]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function alternar(novoValor) {
    if (atualizando) return;
    setAtualizando(true);
    setErro(null);
    try {
      await atualizarStatusSensor({ codigo, status: novoValor });
      
      const confirmado = await visualizarSensor(codigo);
      setStatus(confirmado.status);
    } catch (e) {
     
      setErro(`Não foi possível alterar o sensor. ${e.message}`);
    } finally {
      setAtualizando(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.codigo}>{codigo}</Text>
        {tipo ? <Text style={styles.tipo}>{tipo}</Text> : null}

        {carregando ? (
          <ActivityIndicator style={styles.espaco} size="large" color="#2563eb" />
        ) : (
          <>
            <View style={styles.linhaStatus}>
              <View style={[styles.ponto, status ? styles.on : styles.off]} />
              <Text style={styles.statusTexto}>{status ? 'Ligado' : 'Desligado'}</Text>
            </View>

            <View style={styles.controle}>
              <Text style={styles.controleTexto}>
                {atualizando ? 'Atualizando…' : 'Ligar sensor'}
              </Text>
              {atualizando ? (
                <ActivityIndicator color="#2563eb" />
              ) : (
                <Switch
                  value={status}
                  onValueChange={alternar}
                  disabled={atualizando}
                  trackColor={{ false: '#c5ccd4', true: '#86d7a8' }}
                  thumbColor={status ? '#22a55b' : '#f4f5f7'}
                />
              )}
            </View>
          </>
        )}

        {erro ? (
          <View style={styles.erroBox}>
            <Text style={styles.erroTexto}>{erro}</Text>
            <TouchableOpacity onPress={carregar} style={styles.linkBotao}>
              <Text style={styles.link}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      <TouchableOpacity style={styles.voltar} onPress={() => navigation.goBack()}>
        <Text style={styles.voltarTexto}>Voltar para a lista</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f5f8', padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  codigo: { fontSize: 28, fontWeight: '800', color: '#1b2430' },
  tipo: { fontSize: 16, color: '#6b7683', marginTop: 2, textTransform: 'capitalize' },
  espaco: { marginVertical: 32 },
  linhaStatus: { flexDirection: 'row', alignItems: 'center', marginTop: 24 },
  ponto: { width: 14, height: 14, borderRadius: 7, marginRight: 10 },
  on: { backgroundColor: '#22a55b' },
  off: { backgroundColor: '#9aa3ad' },
  statusTexto: { fontSize: 20, fontWeight: '600', color: '#1b2430' },
  controle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e6e9ee',
  },
  controleTexto: { fontSize: 16, color: '#1b2430' },
  erroBox: { backgroundColor: '#fdecec', borderRadius: 10, padding: 12, marginTop: 16 },
  erroTexto: { color: '#a12626', fontSize: 14 },
  linkBotao: { marginTop: 8, minHeight: 32, justifyContent: 'center' },
  link: { color: '#2563eb', fontWeight: '600' },
  voltar: {
    marginTop: 16,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c5ccd4',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voltarTexto: { fontSize: 16, fontWeight: '600', color: '#1b2430' },
});