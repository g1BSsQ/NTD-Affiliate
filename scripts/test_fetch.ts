import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
  console.log('--- Testing Subordinate Fetch Logic ---');
  
  // Admin ID
  const adminId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  
  const { data, error } = await supabase
    .from('network_nodes')
    .select(`
      user_id,
      position,
      total_sales,
      profiles:network_nodes_user_id_fkey(full_name, status)
    `)
    .eq('sponsor_id', adminId);

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  console.log('Raw Data count:', data?.length);
  
  const mapped = data?.map((item: any) => {
    const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
    return {
      user_id: item.user_id,
      position: item.position,
      total_sales: item.total_sales,
      full_name: profile?.full_name || 'Hội viên mới',
      status: profile?.status || 'NEW'
    };
  });

  console.log('Mapped Results:');
  console.log(JSON.stringify(mapped, null, 2));
}

testFetch();
