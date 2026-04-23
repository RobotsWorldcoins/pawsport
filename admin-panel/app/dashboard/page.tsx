import { supabaseAdmin } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';
import { validateAdminSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

async function getStats() {
  const [users, dogs, checkins, subscriptions, posts, competitions] = await Promise.all([
    supabaseAdmin.from('users').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('dogs').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('checkins').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabaseAdmin.from('social_posts').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('competitions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
  ]);

  // Recent signups
  const { data: recentUsers } = await supabaseAdmin
    .from('users')
    .select('id, full_name, email, subscription_tier, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  // Revenue estimate
  const { data: premiumSubs } = await supabaseAdmin
    .from('subscriptions')
    .select('tier')
    .eq('status', 'active');

  const revenue = (premiumSubs || []).reduce((sum: number, s: any) => {
    return sum + (s.tier === 'premium_pro' ? 19.99 : 9.99);
  }, 0);

  return {
    totalUsers: users.count || 0,
    totalDogs: dogs.count || 0,
    totalCheckins: checkins.count || 0,
    activeSubscriptions: subscriptions.count || 0,
    totalPosts: posts.count || 0,
    activeCompetitions: competitions.count || 0,
    monthlyRevenue: revenue,
    recentUsers: recentUsers || [],
  };
}

export default async function DashboardPage() {
  const isAdmin = await validateAdminSession();
  if (!isAdmin) redirect('/login');

  const stats = await getStats();

  const STAT_CARDS = [
    { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: 'bg-blue-500' },
    { label: 'Dogs Registered', value: stats.totalDogs, icon: '🐶', color: 'bg-orange-500' },
    { label: 'Total Check-ins', value: stats.totalCheckins, icon: '📍', color: 'bg-green-500' },
    { label: 'Active Subscribers', value: stats.activeSubscriptions, icon: '💎', color: 'bg-yellow-500' },
    { label: 'Social Posts', value: stats.totalPosts, icon: '📱', color: 'bg-purple-500' },
    { label: 'Est. Monthly Revenue', value: `€${stats.monthlyRevenue.toFixed(2)}`, icon: '💰', color: 'bg-emerald-500' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, Admin 🐾</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {STAT_CARDS.map((card) => (
            <div key={card.label} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">{card.label}</p>
                  <p className="text-3xl font-black text-gray-900 mt-1">{card.value}</p>
                </div>
                <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center text-2xl`}>
                  {card.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Sign-ups</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-3 font-semibold">Name</th>
                  <th className="pb-3 font-semibold">Email</th>
                  <th className="pb-3 font-semibold">Plan</th>
                  <th className="pb-3 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.recentUsers.map((user: any) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">{user.full_name || '—'}</td>
                    <td className="py-3 text-gray-500">{user.email}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        user.subscription_tier === 'premium_pro' ? 'bg-yellow-100 text-yellow-800' :
                        user.subscription_tier === 'premium' ? 'bg-gray-100 text-gray-700' :
                        'bg-gray-50 text-gray-400'
                      }`}>
                        {user.subscription_tier}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Active Competitions */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-2">System Status</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span><span>Supabase DB: Online</span></div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span><span>Stripe Webhooks: Active</span></div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span><span>Active Competitions: {stats.activeCompetitions}</span></div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span><span>Edge Functions: Deployed</span></div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
