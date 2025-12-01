import { useState, useEffect } from 'react'
import api from '../api'

export default function Loans() {
    const [loans, setLoans] = useState([])
    const [books, setBooks] = useState([])
    const [users, setUsers] = useState([])
    const [formData, setFormData] = useState({ book_id: '', user_id: '', due_date: '' })
    const [loanDuration, setLoanDuration] = useState('14')
    const [errors, setErrors] = useState({})

    // Search states
    const [bookSearch, setBookSearch] = useState('')
    const [userSearch, setUserSearch] = useState('')
    const [loanSearch, setLoanSearch] = useState('')
    const [showBookDropdown, setShowBookDropdown] = useState(false)
    const [showUserDropdown, setShowUserDropdown] = useState(false)

    // QR Scanner State
    const [showScanner, setShowScanner] = useState(false)

    useEffect(() => {
        fetchLoans()
        fetchBooks()
        fetchUsers()

        // Set default due date (14 days)
        const date = new Date()
        date.setDate(date.getDate() + 14)
        setFormData(prev => ({ ...prev, due_date: date.toISOString().split('T')[0] }))
    }, [])

    // QR Scanner Logic
    useEffect(() => {
        let scanner = null
        if (showScanner && window.Html5QrcodeScanner) {
            scanner = new window.Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                /* verbose= */ false
            )
            scanner.render(onScanSuccess, onScanFailure)
        }

        return () => {
            if (scanner) {
                scanner.clear().catch(error => console.error("Failed to clear scanner", error))
            }
        }
    }, [showScanner])

    const onScanSuccess = (decodedText, decodedResult) => {
        const scannedId = decodedText.trim()
        const foundBook = books.find(b => b.id.toString() === scannedId)

        if (foundBook) {
            setBookSearch(foundBook.title)
            setFormData(prev => ({ ...prev, book_id: foundBook.id }))
            setErrors(prev => ({ ...prev, book_id: null }))
        } else {
            alert("لم يتم العثور على الكتاب بهذا الرمز: " + scannedId)
            setBookSearch(scannedId)
        }
        setShowScanner(false)
    }

    const onScanFailure = (error) => {
        // console.warn(`Code scan error = ${error}`)
    }

    const fetchLoans = async () => {
        try {
            const response = await api.get('/loans/')
            setLoans(response.data)
        } catch (error) {
            console.error("Error fetching loans:", error)
        }
    }

    const fetchBooks = async () => {
        try {
            const response = await api.get('/books/')
            setBooks(response.data)
        } catch (error) {
            console.error("Error fetching books:", error)
        }
    }

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users/')
            setUsers(response.data)
        } catch (error) {
            console.error("Error fetching users:", error)
        }
    }

    const handleDurationChange = (e) => {
        const duration = e.target.value
        setLoanDuration(duration)
        if (duration !== 'custom') {
            const date = new Date()
            date.setDate(date.getDate() + parseInt(duration))
            setFormData(prev => ({ ...prev, due_date: date.toISOString().split('T')[0] }))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setErrors({})

        // Client-side validation
        const newErrors = {}
        if (!formData.book_id) newErrors.book_id = "يرجى اختيار كتاب"
        if (!formData.user_id) newErrors.user_id = "يرجى اختيار مستخدم"
        if (!formData.due_date) newErrors.due_date = "يرجى تحديد تاريخ الإرجاع"

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }

        try {
            const payload = {
                ...formData,
                due_date: formData.due_date
            }
            await api.post('/loans/', payload)

            // Reset form
            const defaultDate = new Date()
            defaultDate.setDate(defaultDate.getDate() + 14)
            setFormData({ book_id: '', user_id: '', due_date: defaultDate.toISOString().split('T')[0] })
            setLoanDuration('14')
            setErrors({})

            setBookSearch('')
            setUserSearch('')
            fetchLoans()
        } catch (error) {
            console.error("Loan creation error:", error)
            if (error.response?.data?.detail) {
                // Handle FastAPI validation errors (array of objects)
                if (Array.isArray(error.response.data.detail)) {
                    const backendErrors = {}
                    error.response.data.detail.forEach(err => {
                        // Map backend field names to frontend state keys if needed
                        const field = err.loc[err.loc.length - 1]
                        backendErrors[field] = err.msg
                    })
                    setErrors(backendErrors)
                } else {
                    // Handle generic string error
                    alert("خطأ: " + error.response.data.detail)
                }
            } else {
                alert("حدث خطأ غير متوقع أثناء إنشاء الإعارة")
            }
        }
    }

    const handleReturn = async (loanId) => {
        try {
            await api.put(`/loans/${loanId}/return`)
            fetchLoans()
        } catch (error) {
            alert("فشل في إرجاع الكتاب")
        }
    }

    const formatDate = (dateString) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toLocaleDateString('en-GB') // DD/MM/YYYY
    }

    // Filtered lists
    const filteredBooks = books.filter(book =>
        book.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
        (book.isbn && book.isbn.includes(bookSearch)) ||
        book.id.toString().includes(bookSearch)
    )

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        (user.phone && user.phone.includes(userSearch))
    )

    // Filter loans for the list (Active only + Search)
    const filteredLoans = loans.filter(loan => {
        // Hide returned loans
        if (loan.return_date) return false

        const book = books.find(b => b.id === loan.book_id)
        const user = users.find(u => u.id === loan.user_id)
        const searchLower = loanSearch.toLowerCase()

        return (
            loan.id.toString().includes(searchLower) ||
            (book && book.title.toLowerCase().includes(searchLower)) ||
            (user && user.name.toLowerCase().includes(searchLower))
        )
    })

    // Auto-select book if exact ID match
    useEffect(() => {
        const exactMatch = books.find(b => b.id.toString() === bookSearch.trim())
        if (exactMatch) {
            setFormData(prev => ({ ...prev, book_id: exactMatch.id }))
        }
    }, [bookSearch, books])

    return (
        <div className="space-y-8">
            {/* Scanner Modal */}
            {showScanner && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowScanner(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6">
                            <div>
                                <div id="reader" width="600px"></div>
                            </div>
                            <div className="mt-5 sm:mt-6">
                                <button type="button" className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:text-sm" onClick={() => setShowScanner(false)}>
                                    إغلاق
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Issue Loan Form */}
            <div className="bg-white shadow-md rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-800">تسجيل إعارة جديدة</h3>
                    <p className="mt-1 text-sm text-gray-500">إعارة كتاب لمستخدم.</p>
                </div>
                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

                            {/* Book Selection */}
                            <div className="relative">
                                <label htmlFor="book_search" className="block text-sm font-medium text-gray-700">الكتاب (بحث بالاسم أو ID)</label>
                                <div className="mt-1 flex rounded-md shadow-sm">
                                    <input
                                        type="text"
                                        id="book_search"
                                        placeholder="ابحث أو امسح QR..."
                                        value={bookSearch}
                                        onChange={e => {
                                            setBookSearch(e.target.value)
                                            setShowBookDropdown(true)
                                            if (e.target.value === '') setFormData(prev => ({ ...prev, book_id: '' }))
                                        }}
                                        onFocus={() => setShowBookDropdown(true)}
                                        className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300 border p-2.5"
                                        autoComplete="off"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowScanner(true)}
                                        className="-ml-px relative inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-l-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                        </svg>
                                    </button>
                                </div>
                                {formData.book_id && <div className="mt-1 text-xs text-green-600 font-semibold">تم الاختيار (ID: {formData.book_id})</div>}

                                {showBookDropdown && bookSearch && (
                                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                                        {filteredBooks.length === 0 ? (
                                            <div className="cursor-default select-none relative py-2 px-4 text-gray-700">
                                                لا توجد نتائج
                                            </div>
                                        ) : (
                                            filteredBooks.map((book) => (
                                                <div
                                                    key={book.id}
                                                    className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-50"
                                                    onClick={() => {
                                                        setFormData(prev => ({ ...prev, book_id: book.id }))
                                                        setBookSearch(book.title)
                                                        setShowBookDropdown(false)
                                                    }}
                                                >
                                                    <div className="flex items-center">
                                                        <span className="font-normal ml-3 block truncate">
                                                            {book.title}
                                                        </span>
                                                        <span className="text-gray-500 text-xs">
                                                            (ID: {book.id}) {book.is_available ? '✅' : '❌'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                                {/* Hidden input for validation */}
                                <input type="number" name="book_id" required value={formData.book_id} className="sr-only" readOnly />
                                {errors.book_id && <p className="mt-1 text-xs text-red-600 font-semibold">{errors.book_id}</p>}
                            </div>

                            {/* User Selection */}
                            <div className="relative">
                                <label htmlFor="user_search" className="block text-sm font-medium text-gray-700">المستخدم</label>
                                <input
                                    type="text"
                                    id="user_search"
                                    placeholder="ابحث عن مستخدم..."
                                    value={userSearch}
                                    onChange={e => {
                                        setUserSearch(e.target.value)
                                        setShowUserDropdown(true)
                                        if (e.target.value === '') setFormData(prev => ({ ...prev, user_id: '' }))
                                    }}
                                    onFocus={() => setShowUserDropdown(true)}
                                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2.5"
                                    autoComplete="off"
                                />
                                {formData.user_id && <div className="mt-1 text-xs text-green-600 font-semibold">تم الاختيار (ID: {formData.user_id})</div>}

                                {showUserDropdown && userSearch && (
                                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                                        {filteredUsers.length === 0 ? (
                                            <div className="cursor-default select-none relative py-2 px-4 text-gray-700">
                                                لا توجد نتائج
                                            </div>
                                        ) : (
                                            filteredUsers.map((user) => (
                                                <div
                                                    key={user.id}
                                                    className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-50"
                                                    onClick={() => {
                                                        setFormData(prev => ({ ...prev, user_id: user.id }))
                                                        setUserSearch(user.name)
                                                        setShowUserDropdown(false)
                                                    }}
                                                >
                                                    <div className="flex items-center">
                                                        <span className="font-normal ml-3 block truncate">
                                                            {user.name}
                                                        </span>
                                                        <span className="text-gray-500 text-xs">
                                                            (ID: {user.id})
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                                {/* Hidden input for validation */}
                                <input type="number" name="user_id" required value={formData.user_id} className="sr-only" readOnly />
                                {errors.user_id && <p className="mt-1 text-xs text-red-600 font-semibold">{errors.user_id}</p>}
                            </div>

                            <div>
                                <label htmlFor="loan_duration" className="block text-sm font-medium text-gray-700">مدة الإعارة</label>
                                <select
                                    id="loan_duration"
                                    value={loanDuration}
                                    onChange={handleDurationChange}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                                >
                                    <option value="7">أسبوع (7 أيام)</option>
                                    <option value="14">أسبوعين (14 يوم)</option>
                                    <option value="30">شهر (30 يوم)</option>
                                    <option value="custom">تاريخ مخصص</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">تاريخ الإرجاع</label>
                                <input
                                    type="date"
                                    name="due_date"
                                    id="due_date"
                                    required
                                    value={formData.due_date}
                                    onChange={e => {
                                        setFormData({ ...formData, due_date: e.target.value })
                                        setLoanDuration('custom')
                                    }}
                                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2.5 text-center font-sans"
                                    style={{ direction: 'ltr' }}
                                />
                                {errors.due_date && <p className="mt-1 text-xs text-red-600 font-semibold">{errors.due_date}</p>}
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button type="submit" className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-bold rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                                تسجيل الإعارة
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Active Loans List */}
            <div className="bg-white shadow-md rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h3 className="text-lg font-bold text-gray-800">الإعارات النشطة</h3>
                    <div className="relative w-full sm:w-64">
                        <input
                            type="text"
                            placeholder="بحث في الإعارات..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            value={loanSearch}
                            onChange={(e) => setLoanSearch(e.target.value)}
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                </div>
                <ul className="divide-y divide-gray-100">
                    {filteredLoans.length === 0 ? (
                        <li className="px-6 py-10 text-center text-gray-500">لا توجد إعارات نشطة مطابقة للبحث.</li>
                    ) : (
                        filteredLoans.map((loan) => {
                            const isOverdue = !loan.return_date && new Date(loan.due_date) < new Date();
                            // Find book and user details for display
                            const book = books.find(b => b.id === loan.book_id)
                            const user = users.find(u => u.id === loan.user_id)

                            return (
                                <li key={loan.id} className={`hover:bg-gray-50 transition-colors ${isOverdue ? "bg-red-50 hover:bg-red-100" : ""}`}>
                                    <div className="px-6 py-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex items-start sm:items-center gap-4">
                                                <div className={`p-2 rounded-full flex-shrink-0 ${isOverdue ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">إعارة #{loan.id}</p>
                                                    <div className="flex flex-col sm:flex-row sm:gap-4 mt-1 text-xs text-gray-500">
                                                        <span>{book ? book.title : `كتاب ID: ${loan.book_id}`}</span>
                                                        <span className="hidden sm:inline">•</span>
                                                        <span>{user ? user.name : `مستخدم ID: ${loan.user_id}`}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                                                <div className="text-left">
                                                    <p className="text-xs text-gray-500">تاريخ الإرجاع</p>
                                                    <p className={`text-sm font-bold ${isOverdue ? 'text-red-600' : 'text-gray-700'}`} dir="ltr">
                                                        {formatDate(loan.due_date)}
                                                    </p>
                                                </div>

                                                <div className="flex-shrink-0">
                                                    {isOverdue && (
                                                        <span className="ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                            متأخر
                                                        </span>
                                                    )}
                                                    <button onClick={() => handleReturn(loan.id)} className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 hover:bg-green-200 transition-colors">
                                                        تسجيل كمرتجع
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            )
                        })
                    )}
                </ul>
            </div>
        </div>
    )
}
