import notifee, { AndroidImportance } from '@notifee/react-native';

const CHANNEL_ID = 'ntd_affiliate_default';

/**
 * Tạo Android notification channel. Phải gọi trước khi hiển thị notification.
 * An toàn khi gọi nhiều lần (idempotent).
 */
export async function createDefaultChannel(): Promise<void> {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'NTD Affiliate',
    importance: AndroidImportance.HIGH,
    sound: 'default',
  });
}

/**
 * Gửi notification khi đơn hàng được Admin duyệt (COMPLETED).
 */
export async function notifyOrderApproved(totalPrice: number): Promise<void> {
  try {
    await createDefaultChannel();
    const formatted = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(totalPrice);
    await notifee.displayNotification({
      title: '✅ Đơn hàng đã được duyệt!',
      body: `Đơn hàng ${formatted} của bạn đã được Admin xác nhận thành công. Hoa hồng sẽ được cập nhật sớm.`,
      android: {
        channelId: CHANNEL_ID,
        smallIcon: 'ic_launcher',
        pressAction: { id: 'default' },
      },
    });
  } catch (e) {
    console.warn('notifyOrderApproved failed:', e);
  }
}

/**
 * Gửi notification khi lệnh rút tiền được Admin duyệt.
 */
export async function notifyWithdrawApproved(amount: number): Promise<void> {
  try {
    await createDefaultChannel();
    const formatted = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
    await notifee.displayNotification({
      title: '💸 Lệnh rút tiền đã được duyệt!',
      body: `${formatted} đang được chuyển về tài khoản ngân hàng của bạn.`,
      android: {
        channelId: CHANNEL_ID,
        smallIcon: 'ic_launcher',
        pressAction: { id: 'default' },
      },
    });
  } catch (e) {
    console.warn('notifyWithdrawApproved failed:', e);
  }
}
