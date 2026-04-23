import { supabaseAdmin } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';
import { validateAdminSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ page?: string; search?: string }> }) {
  const isAdmin = await validateAdminSession();
  if (!isAdmin) redirect('/login');

  const sp = await searchParams;
  const page = parseInt(sp.page || '1');
  const search = sp.search || '';
  const pageSize = 20;

  let query = supabaseAdmin
    .from('users')
    .select('*, dogs(count)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (search) {
    query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
  }

  const { data: users, count } = await query;
  const totalPages = Math.ceil((count || 0) / pageSize);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black text-gray-900">Users ({count})</h1>
        </div>

        <form className="flex gap-3">
          <input
            name="search"
            defaultValue={search}
            placeholder="Search by name or email..."
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400"
          />
          <button type="submit" className="bg-orange-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-orange-600">
            Search
          </button>
        </form>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">User</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Email</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Plan</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Dogs</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(users || []).map((user: any) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{user.full_name || 'Unknown'}</div>
                    <div className="text-xs text-gray-400">{user.id.slice(0, 8)}...</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      user.subscription_tier === 'premium_pro' ? 'bg-yellow-100 text-yellow-800' :
                      user.subscription_tier === 'premium' ? 'bg-gray-100 text-gray-600' :
                      'bg-gray-50 text-gray-400'
                    }`}>
                      {user.subscription_tier}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{user.dogs?.[0]?.count || 0}</td>
                  <td className="px-6 py-4 text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                {page > 1 && (
                  <a href={`?page=${page - 1}&search=${search}`} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">← Prev</a>
                )}
                {page < totalPages && (
                  <a href={`?page=${page + 1}&search=${search}`} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Next →</a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
