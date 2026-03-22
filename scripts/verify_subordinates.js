const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lemmmqdgitaqbffzwfss.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlbW1tcWRnaXRhcWJmZnp3ZnNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMzA4MzQsImV4cCI6MjA4OTcwNjgzNH0.aSghlfJ4SDsQkvuvsa9q-Sjbf8CK4w4z5yHo2l2dGQo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
  console.log('--- Standalone Verification Script ---');
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
    process.exit(1);
  }

  const mapped = data.map((item) => {
    const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
    return {
      full_name: profile?.full_name || 'Hội viên mới',
      position: item.position,
      status: profile?.status || 'NEW'
    };
  });

  console.log('RESULT:', JSON.stringify(mapped, null, 2));
}

testFetch();
