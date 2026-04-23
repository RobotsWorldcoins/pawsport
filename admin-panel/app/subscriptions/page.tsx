import { supabaseAdmin } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';
import { validateAdminSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function SubscriptionsPage() {
  const isAdmin = await validateAdminSession();
  if (!isAdmin) redirect('/login');

  const { data: subs, count } = await supabaseAdmin
    .from('subscriptions')
    .select('*, user:users(full_name,email)', { count: 'exact' })
    .order('created_at', { ascending: false });

  const active = (subs || []).filter((s: any) => s.status === 'active');
  const revenue = active.reduce((sum: number, s: any) => sum + (s.tier === 'premium_pro' ? 19.99 : 9.99), 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black text-gray-900">Subscriptions ({count})</h1>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">
            <p className="text-xs text-emerald-600 font-medium">Est. Monthly Revenue</p>
            <p className="text-2xl font-black text-emerald-700">€{revenue.toFixed(2)}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-2xl font-black text-gray-900">{active.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500">Premium</p>
            <p className="text-2xl font-black text-gray-900">{active.filter((s: any) => s.tier === 'premium').length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500">Pro</p>
            <p className="text-2xl font-black text-yellow-500">{active.filter((s: any) => s.tier === 'premium_pro').length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">User</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Plan</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Renews</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Stripe ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(subs || []).map((sub: any) => (
                <tr key={sub.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{sub.user?.full_name || '—'}</p>
                    <p className="text-xs text-gray-400">{sub.user?.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                      sub.tier === 'premium_pro' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {sub.tier}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold ${
                      sub.status === 'active' ? 'text-green-600' :
                      sub.status === 'past_due' ? 'text-red-600' : 'text-gray-400'
                    }`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">{new Date(sub.current_period_end).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-gray-400 text-xs font-mono">{sub.stripe_subscription_id?.slice(0, 14)}...</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
