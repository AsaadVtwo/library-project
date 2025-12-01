import { useState, useEffect } from 'react'
import api from '../api'

export default function Users() {
    const [users, setUsers] = useState([])
    const [formData, setFormData] = useState({ name: '', email: '', phone: '' })
    const [searchTerm, setSearchTerm] = useState('')
    const [errors, setErrors] = useState({})
    const [editingUser, setEditingUser] = useState(null)

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users/')
            setUsers(response.data)
        } catch (error) {
            console.error("Error fetching users:", error)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setErrors({})

        // Client-side validation
        const newErrors = {}
        if (!formData.name) newErrors.name = "يرجى إدخال الاسم الكامل"

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }

        try {
            if (editingUser) {
                await api.put(`/users/${editingUser.id}`, formData)
                setEditingUser(null)
            } else {
                await api.post('/users/', formData)
            }
            setFormData({ name: '', email: '', phone: '' })
            setErrors({})
            fetchUsers()
        } catch (error) {
            console.error("Error saving user:", error)
            if (error.response?.data?.detail) {
                if (Array.isArray(error.response.data.detail)) {
                    const backendErrors = {}
                    error.response.data.detail.forEach(err => {
                        const field = err.loc[err.loc.length - 1]
                        backendErrors[field] = err.msg
                    })
                    setErrors(backendErrors)
                } else {
                    alert("خطأ: " + error.response.data.detail)
                }
            } else {
                alert("فشل في حفظ بيانات المستخدم")
            }
        }
    }

    const handleEdit = (user) => {
        setEditingUser(user)
        setFormData({
            name: user.name,
            email: user.email || '',
            phone: user.phone || ''
        })
        setErrors({})
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleDelete = async (userId) => {
        if (window.confirm("هل أنت متأكد من حذف هذا المستخدم؟")) {
            try {
                await api.delete(`/users/${userId}`)
                fetchUsers()
            } catch (error) {
                console.error("Error deleting user:", error)
                alert("فشل في حذف المستخدم")
            }
        }
    }

    const cancelEdit = () => {
        setEditingUser(null)
        setFormData({ name: '', email: '', phone: '' })
        setErrors({})
    }

    return (
        <div className="space-y-8">
            {/* Add User Form */}
            <div className="bg-white shadow-md rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">{editingUser ? 'تعديل بيانات مستخدم' : 'إضافة مستخدم جديد'}</h3>
                        <p className="mt-1 text-sm text-gray-500">{editingUser ? 'تعديل بيانات العضو الحالي.' : 'سجل عضو جديد في المكتبة.'}</p>
                    </div>
                    {editingUser && (
                        <button onClick={cancelEdit} className="text-sm text-red-600 hover:text-red-800 font-medium">
                            إلغاء التعديل
                        </button>
                    )}
                </div>
                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">الاسم الكامل</label>
                                <input type="text" name="name" id="name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2.5" />
                                {errors.name && <p className="mt-1 text-xs text-red-600 font-semibold">{errors.name}</p>}
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">البريد الإلكتروني</label>
                                <input type="email" name="email" id="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2.5" />
                                {errors.email && <p className="mt-1 text-xs text-red-600 font-semibold">{errors.email}</p>}
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">رقم الهاتف</label>
                                <input type="text" name="phone" id="phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2.5" />
                                {errors.phone && <p className="mt-1 text-xs text-red-600 font-semibold">{errors.phone}</p>}
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            {editingUser && (
                                <button type="button" onClick={cancelEdit} className="inline-flex justify-center py-2 px-6 border border-gray-300 shadow-sm text-sm font-bold rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                                    إلغاء
                                </button>
                            )}
                            <button type="submit" className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-bold rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                                {editingUser ? 'حفظ التعديلات' : 'إضافة مستخدم'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Users List */}
            <div className="bg-white shadow-md rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h3 className="text-lg font-bold text-gray-800">قائمة المستخدمين</h3>
                    <div className="relative w-full sm:w-64">
                        <input
                            type="text"
                            placeholder="بحث عن مستخدم..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                </div>
                <ul className="divide-y divide-gray-100">
                    {users.filter(user => user.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                        <li className="px-6 py-10 text-center text-gray-500">لا يوجد مستخدمين مطابقين للبحث.</li>
                    ) : (
                        users.filter(user => user.name.toLowerCase().includes(searchTerm.toLowerCase())).map((user) => (
                            <li key={user.id} className="hover:bg-gray-50 transition-colors">
                                <div className="px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{user.name}</p>
                                                <p className="text-xs text-gray-500">ID: {user.id}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-600 flex items-center justify-end gap-2">
                                                {user.email}
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                            </p>
                                            <p className="text-sm text-gray-600 flex items-center justify-end gap-2 mt-1">
                                                {user.phone}
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 mr-4">
                                            <button onClick={() => handleEdit(user)} className="text-indigo-600 hover:text-indigo-900 p-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-900 p-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    )
}
