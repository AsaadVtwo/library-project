import { useState, useEffect } from 'react'
import api from '../api'

export default function Admins() {
    const [admins, setAdmins] = useState([])
    const [formData, setFormData] = useState({ name: '', email: '', password: '' })
    const [editingAdmin, setEditingAdmin] = useState(null)
    const [errors, setErrors] = useState({})

    useEffect(() => {
        fetchAdmins()
    }, [])

    const fetchAdmins = async () => {
        try {
            const response = await api.get('/admins/')
            setAdmins(response.data)
        } catch (error) {
            console.error("Error fetching admins:", error)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setErrors({})

        try {
            if (editingAdmin) {
                const updateData = { ...formData }
                if (!updateData.password) delete updateData.password // Don't send empty password if not changing
                await api.put(`/admins/${editingAdmin.id}`, updateData)
                setEditingAdmin(null)
            } else {
                await api.post('/admins/', formData)
            }
            setFormData({ name: '', email: '', password: '' })
            fetchAdmins()
        } catch (error) {
            console.error("Error saving admin:", error)
            if (error.response?.data?.detail) {
                alert("خطأ: " + error.response.data.detail)
            } else {
                alert("فشل في حفظ بيانات المدير")
            }
        }
    }

    const handleEdit = (admin) => {
        setEditingAdmin(admin)
        setFormData({
            name: admin.name,
            email: admin.email,
            password: '' // Don't populate password
        })
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleDelete = async (adminId) => {
        if (window.confirm("هل أنت متأكد من حذف هذا المدير؟")) {
            try {
                await api.delete(`/admins/${adminId}`)
                fetchAdmins()
            } catch (error) {
                console.error("Error deleting admin:", error)
                alert("فشل في حذف المدير")
            }
        }
    }

    const cancelEdit = () => {
        setEditingAdmin(null)
        setFormData({ name: '', email: '', password: '' })
        setErrors({})
    }

    return (
        <div className="space-y-8">
            {/* Add/Edit Admin Form */}
            <div className="bg-white shadow-md rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">{editingAdmin ? 'تعديل بيانات مدير' : 'إضافة مدير جديد'}</h3>
                        <p className="mt-1 text-sm text-gray-500">{editingAdmin ? 'تعديل بيانات المدير الحالي.' : 'إضافة مدير جديد للنظام.'}</p>
                    </div>
                    {editingAdmin && (
                        <button onClick={cancelEdit} className="text-sm text-red-600 hover:text-red-800 font-medium">
                            إلغاء التعديل
                        </button>
                    )}
                </div>
                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">الاسم</label>
                                <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">البريد الإلكتروني</label>
                                <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">كلمة المرور {editingAdmin && '(اتركها فارغة للإبقاء على الحالية)'}</label>
                                <input type="password" required={!editingAdmin} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            {editingAdmin && (
                                <button type="button" onClick={cancelEdit} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                                    إلغاء
                                </button>
                            )}
                            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                                {editingAdmin ? 'حفظ التعديلات' : 'إضافة مدير'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Admins List */}
            <div className="bg-white shadow-md rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-800">قائمة المدراء</h3>
                </div>
                <ul className="divide-y divide-gray-100">
                    {admins.map((admin) => (
                        <li key={admin.id} className="hover:bg-gray-50 transition-colors">
                            <div className="px-6 py-4 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{admin.name}</p>
                                    <p className="text-sm text-gray-500">{admin.email}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleEdit(admin)} className="text-indigo-600 hover:text-indigo-900 p-1">
                                        تعديل
                                    </button>
                                    <button onClick={() => handleDelete(admin.id)} className="text-red-600 hover:text-red-900 p-1">
                                        حذف
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}
