import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  FlatList,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../constants/colors';
import { FontSize } from '../constants/typography';
import { Spacing, Radius } from '../constants/spacing';

interface AddressItem {
  code: number;
  name: string;
}

interface VNAddressPickerProps {
  onAddressChange: (fullAddress: string) => void;
  initialAddress?: string;
  placeholder?: string;
}

export const VNAddressPicker: React.FC<VNAddressPickerProps> = ({ 
  onAddressChange, 
  initialAddress = '',
  placeholder = 'Chọn địa chỉ giao hàng'
}) => {
  const [provinces, setProvinces] = useState<AddressItem[]>([]);
  const [districts, setDistricts] = useState<AddressItem[]>([]);
  const [wards, setWards] = useState<AddressItem[]>([]);
  
  const [selectedP, setSelectedP] = useState<AddressItem | null>(null);
  const [selectedD, setSelectedD] = useState<AddressItem | null>(null);
  const [selectedW, setSelectedW] = useState<AddressItem | null>(null);
  const [detail, setDetail] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [pickingType, setPickingType] = useState<'p' | 'd' | 'w'>('p');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Fetch provinces on mount
  useEffect(() => {
    fetchProvinces();
  }, []);

  const fetchProvinces = async () => {
    try {
      setLoading(true);
      const res = await fetch('https://provinces.open-api.vn/api/p/');
      const data = (await res.json()) as AddressItem[];
      setProvinces(data);
    } catch (e) {
      console.error('Fetch provinces failed', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDistricts = async (pCode: number) => {
    try {
      setLoading(true);
      const res = await fetch(`https://provinces.open-api.vn/api/p/${pCode}?depth=2`);
      const data = (await res.json()) as { districts: AddressItem[] };
      setDistricts(data.districts);
    } catch (e) {
      console.error('Fetch districts failed', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchWards = async (dCode: number) => {
    try {
      setLoading(true);
      const res = await fetch(`https://provinces.open-api.vn/api/d/${dCode}?depth=2`);
      const data = (await res.json()) as { wards: AddressItem[] };
      setWards(data.wards);
    } catch (e) {
      console.error('Fetch wards failed', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePick = (item: AddressItem) => {
    setSearch('');
    if (pickingType === 'p') {
      setSelectedP(item);
      setSelectedD(null);
      setSelectedW(null);
      fetchDistricts(item.code);
    } else if (pickingType === 'd') {
      setSelectedD(item);
      setSelectedW(null);
      fetchWards(item.code);
    } else {
      setSelectedW(item);
    }
    setModalVisible(false);
  };

  useEffect(() => {
    updateFullAddress();
  }, [selectedP, selectedD, selectedW, detail]);

  const updateFullAddress = () => {
    if (!selectedP) return;
    let parts = [];
    if (detail) parts.push(detail);
    if (selectedW) parts.push(selectedW.name);
    if (selectedD) parts.push(selectedD.name);
    if (selectedP) parts.push(selectedP.name);
    onAddressChange(parts.join(', '));
  };

  const currentList = pickingType === 'p' ? provinces : pickingType === 'd' ? districts : wards;
  const filteredList = currentList.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={styles.container}>
      {/* Province Picker */}
      <Pressable style={styles.pickerTrigger} onPress={() => { setPickingType('p'); setModalVisible(true); }}>
        <Text style={[styles.triggerText, !selectedP && styles.placeholder]}>
          {selectedP ? selectedP.name : 'Chọn Tỉnh/Thành phố'}
        </Text>
      </Pressable>

      {/* District Picker */}
      <Pressable 
        style={[styles.pickerTrigger, !selectedP && styles.disabled]} 
        onPress={() => { if(selectedP) { setPickingType('d'); setModalVisible(true); } }}
      >
        <Text style={[styles.triggerText, !selectedD && styles.placeholder]}>
          {selectedD ? selectedD.name : 'Chọn Quận/Huyện'}
        </Text>
      </Pressable>

      {/* Ward Picker */}
      <Pressable 
        style={[styles.pickerTrigger, !selectedD && styles.disabled]} 
        onPress={() => { if(selectedD) { setPickingType('w'); setModalVisible(true); } }}
      >
        <Text style={[styles.triggerText, !selectedW && styles.placeholder]}>
          {selectedW ? selectedW.name : 'Chọn Phường/Xã'}
        </Text>
      </Pressable>

      {/* Detail Address */}
      <TextInput
        style={styles.detailInput}
        placeholder="Số nhà, tên đường..."
        value={detail}
        onChangeText={setDetail}
        multiline
      />

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {pickingType === 'p' ? 'Chọn Tỉnh/Thành' : pickingType === 'd' ? 'Chọn Quận/Huyện' : 'Chọn Phường/Xã'}
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </Pressable>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm..."
              value={search}
              onChangeText={setSearch}
            />

            {loading ? (
              <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
            ) : (
              <FlatList
                data={filteredList}
                keyExtractor={(item) => item.code.toString()}
                renderItem={({ item }) => (
                  <Pressable style={styles.listItem} onPress={() => handlePick(item)}>
                    <Text style={styles.listItemText}>{item.name}</Text>
                  </Pressable>
                )}
                contentContainerStyle={{ paddingBottom: 40 }}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: Spacing.sm },
  pickerTrigger: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    minHeight: 48,
    justifyContent: 'center',
  },
  triggerText: { fontSize: FontSize.sm, color: Colors.text.primary },
  placeholder: { color: Colors.text.tertiary },
  disabled: { backgroundColor: '#f9f9f9', opacity: 0.6 },
  detailInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: FontSize.sm,
    color: Colors.text.primary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg, height: '80%', padding: Spacing.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  modalTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text.primary },
  closeBtn: { fontSize: 20, color: Colors.text.tertiary, padding: 4 },
  searchInput: { backgroundColor: Colors.background, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md, fontSize: FontSize.sm },
  listItem: { paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  listItemText: { fontSize: FontSize.sm, color: Colors.text.primary },
});
