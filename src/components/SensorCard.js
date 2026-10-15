import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function SensorCard({ sensor, onPress }) {
  const ligado = sensor.status;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.indicador, ligado ? styles.on : styles.off]} />
      <View style={styles.info}>
        <Text style={styles.codigo}>{sensor.codigo}</Text>
        {sensor.tipo ? <Text style={styles.tipo}>{sensor.tipo}</Text> : null}
      </View>
      <View style={[styles.badge, ligado ? styles.badgeOn : styles.badgeOff]}>
        <Text style={[styles.badgeTexto, ligado ? styles.textoOn : styles.textoOff]}>
          {ligado ? 'Ligado' : 'Desligado'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    minHeight: 72,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  indicador: { width: 12, height: 12, borderRadius: 6, marginRight: 14 },
  on: { backgroundColor: '#22a55b' },
  off: { backgroundColor: '#9aa3ad' },
  info: { flex: 1 },
  codigo: { fontSize: 18, fontWeight: '700', color: '#1b2430' },
  tipo: { fontSize: 14, color: '#6b7683', marginTop: 2, textTransform: 'capitalize' },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  badgeOn: { backgroundColor: '#e3f6ec' },
  badgeOff: { backgroundColor: '#eceff2' },
  badgeTexto: { fontSize: 13, fontWeight: '600' },
  textoOn: { color: '#167943' },
  textoOff: { color: '#56606b' },
});