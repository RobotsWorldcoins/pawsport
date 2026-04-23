import { supabaseAdmin } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';
import { validateAdminSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function LocationsPage() {
  const isAdmin = await validateAdminSession();
  if (!isAdmin) redirect('/login');

  const { data: locations, count } = await supabaseAdmin
    .from('locations')
    .select('*', { count: 'exact' })
    .order('checkin_count', { ascending: false })
    .limit(50);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-black text-gray-900">Locations ({count})</h1>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Name</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Category</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">City</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Rating</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Check-ins</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(locations || []).map((loc: any) => (
                <tr key={loc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{loc.name}</td>
                  <td className="px-6 py-4 text-gray-600">{loc.category}</td>
                  <td className="px-6 py-4 text-gray-600 capitalize">{loc.city}</td>
                  <td className="px-6 py-4 text-gray-600">⭐ {loc.rating || '—'}</td>
                  <td className="px-6 py-4 text-gray-600">🐾 {loc.checkin_count}</td>
                  <td className="px-6 py-4">
                    {loc.is_verified
                      ? <span className="text-green-600 font-semibold">✓ Yes</span>
                      : <span className="text-gray-400">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
