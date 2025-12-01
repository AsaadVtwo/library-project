import { useState, useEffect } from 'react'
import api from '../api'

export default function Dashboard() {
    const [books, setBooks] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [stats, setStats] = useState({ total_books: 0, total_users: 0, active_loans: 0 })
    const [expandedBook, setExpandedBook] = useState(null)
    const [qrImage, setQrImage] = useState(null)
    const [editingBook, setEditingBook] = useState(null)
    const [editFormData, setEditFormData] = useState({ title: '', author: '', isbn: '' })

    useEffect(() => {
        fetchBooks()
        fetchStats()
    }, [])

    const fetchBooks = async () => {
        try {
            const response = await api.get('/books/')
            setBooks(response.data)
        } catch (error) {
            console.error("Error fetching books:", error)
        } finally {
            setLoading(false)
        }
    }

    const fetchStats = async () => {
        try {
            const response = await api.get('/stats/')
            setStats(response.data)
        } catch (error) {
            console.error("Error fetching stats:", error)
        }
    }

    const filteredBooks = books.filter(book =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (book.isbn && book.isbn.includes(searchTerm))
    )

    const handleShowQr = async (bookId) => {
        if (expandedBook === bookId) {
            setExpandedBook(null)
            setQrImage(null)
            return
        }
        try {
            const response = await api.get(`/books/${bookId}/qr`)
            setQrImage(response.data.qr_image)
            setExpandedBook(bookId)
        } catch (error) {
            console.error("Error fetching QR:", error)
        }
    }

    const handlePrintQr = (book) => {
        const printWindow = window.open('', '', 'width=600,height=600');
        printWindow.document.write(`
            <html dir="rtl">
            <head>
                <title>طباعة QR - ${book.title}</title>
                <style>
                body { font-family: 'Cairo', sans-serif; text-align: center; padding: 20px; }
                img { max-width: 100%; height: auto; }
                .label { border: 2px solid #000; padding: 20px; display: inline-block; border-radius: 10px; }
                h2 { margin: 0 0 10px 0; }
                p { margin: 5px 0; }
                </style>
                <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap" rel="stylesheet">
            </head>
            <body>
                <div class="label">
                <h2>${book.title}</h2>
                <p>${book.author}</p>
                <img src="${qrImage}" />
                <p>${book.isbn || 'رقم: ' + book.id}</p>
                </div>
                <script>
                window.onload = function() { window.print(); window.close(); }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }

    const handleDeleteBook = async (bookId) => {
        if (window.confirm("هل أنت متأكد من حذف هذا الكتاب؟ سيتم حذف جميع الإعارات المرتبطة به.")) {
            try {
                await api.delete(`/books/${bookId}`)
                fetchBooks()
                fetchStats()
            } catch (error) {
                console.error("Error deleting book:", error)
                alert("فشل في حذف الكتاب")
            }
        }
    }

    const handleEditBook = (book) => {
        setEditingBook(book)
        setEditFormData({
            title: book.title,
            author: book.author,
            isbn: book.isbn || ''
        })
    }

    const handleUpdateBook = async (e) => {
        e.preventDefault()
        try {
            await api.put(`/books/${editingBook.id}`, editFormData)
            setEditingBook(null)
            fetchBooks()
        } catch (error) {
            console.error("Error updating book:", error)
            alert("فشل في تحديث بيانات الكتاب")
        }
    }

    if (loading) return <div className="text-center py-10 text-gray-500">جاري التحميل...</div>

    return (
        <div className="space-y-8">
            {/* Edit Book Modal */}
            {editingBook && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
                    <div className="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3 text-center">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">تعديل بيانات الكتاب</h3>
                            <form onSubmit={handleUpdateBook} className="mt-2 text-right space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">عنوان الكتاب</label>
                                    <input
                                        type="text"
                                        required
                                        value={editFormData.title}
                                        onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">المؤلف</label>
                                    <input
                                        type="text"
                                        required
                                        value={editFormData.author}
                                        onChange={(e) => setEditFormData({ ...editFormData, author: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">ISBN</label>
                                    <input
                                        type="text"
                                        value={editFormData.isbn}
                                        onChange={(e) => setEditFormData({ ...editFormData, isbn: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                    />
                                </div>
                                <div className="flex justify-end gap-2 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setEditingBook(null)}
                                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                                    >
                                        إلغاء
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                    >
                                        حفظ
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div className="bg-white overflow-hidden shadow-md rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
                    <div className="px-6 py-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">إجمالي الكتب</dt>
                        <dd className="mt-2 text-4xl font-bold text-indigo-600">{stats.total_books}</dd>
                    </div>
                </div>
                <div className="bg-white overflow-hidden shadow-md rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
                    <div className="px-6 py-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">إجمالي المستخدمين</dt>
                        <dd className="mt-2 text-4xl font-bold text-emerald-600">{stats.total_users}</dd>
                    </div>
                </div>
                <div className="bg-white overflow-hidden shadow-md rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
                    <div className="px-6 py-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">الإعارات النشطة</dt>
                        <dd className="mt-2 text-4xl font-bold text-amber-600">{stats.active_loans}</dd>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white shadow-md rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h3 className="text-lg font-bold text-gray-800">قائمة الكتب</h3>
                    <div className="w-full sm:w-96">
                        <input
                            type="text"
                            placeholder="بحث بالعنوان، المؤلف، أو الرقم التسلسلي..."
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <ul className="divide-y divide-gray-100">
                    {filteredBooks.length === 0 ? (
                        <li className="px-6 py-10 text-center text-gray-500">لا توجد كتب مطابقة للبحث.</li>
                    ) : (
                        filteredBooks.map((book) => (
                            <li key={book.id} className="hover:bg-gray-50 transition-colors">
                                <div className="px-6 py-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-lg font-bold text-indigo-700 truncate">{book.title}</p>
                                            <div className="mt-1 flex items-center text-sm text-gray-500 gap-4">
                                                <span className="flex items-center gap-1">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                    {book.author}
                                                </span>
                                                <span className="hidden sm:inline text-gray-300">|</span>
                                                <span className="hidden sm:inline">ISBN: {book.isbn}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${book.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {book.is_available ? 'متاح' : 'معار'}
                                            </span>
                                            <button
                                                onClick={() => handleShowQr(book.id)}
                                                className="p-2 text-gray-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-indigo-50"
                                                title="عرض رمز QR"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4h2v-4zM6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleEditBook(book)}
                                                className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-full hover:bg-blue-50"
                                                title="تعديل الكتاب"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteBook(book.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-full hover:bg-red-50"
                                                title="حذف الكتاب"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    {expandedBook === book.id && qrImage && (
                                        <div className="mt-6 flex justify-center bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <div className="text-center">
                                                <img src={qrImage} alt="Book QR Code" className="mx-auto h-40 w-40 border-4 border-white shadow-sm rounded-lg" />
                                                <p className="mt-2 text-sm text-gray-500">امسح الرمز لعرض التفاصيل</p>
                                                <button onClick={() => handlePrintQr(book)} className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                    </svg>
                                                    طباعة الملصق
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    )
}
