import { useState, useRef, useEffect } from 'react'
import api from '../api'
import { useNavigate } from 'react-router-dom'

export default function AddBook() {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        title: '',
        author: '',
        isbn: '',
        summary: ''
    })
    const [analyzing, setAnalyzing] = useState(false)
    const [image, setImage] = useState(null)
    const [errors, setErrors] = useState({})

    // Camera Logic
    const [isCameraActive, setIsCameraActive] = useState(false)
    const [stream, setStream] = useState(null)
    const videoRef = useRef(null)

    useEffect(() => {
        if (isCameraActive && stream && videoRef.current) {
            videoRef.current.srcObject = stream
        }
    }, [isCameraActive, stream])

    // Cleanup stream on unmount
    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop())
            }
        }
    }, [stream])

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            setStream(mediaStream)
            setIsCameraActive(true)
        } catch (err) {
            console.error("Error accessing camera:", err)
            alert("لا يمكن الوصول للكاميرا. تأكد من السماح للموقع باستخدام الكاميرا.")
        }
    }

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop())
            setStream(null)
        }
        setIsCameraActive(false)
    }

    const captureImage = () => {
        if (!stream || !videoRef.current) return

        const video = videoRef.current
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0)

        canvas.toBlob(blob => {
            const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" })
            analyzeFile(file)
            stopCamera()
        }, 'image/jpeg')
    }

    const analyzeFile = async (file) => {
        setImage(URL.createObjectURL(file))
        setAnalyzing(true)

        const data = new FormData()
        data.append('file', file)

        try {
            const response = await api.post('/books/analyze', data)
            const result = response.data
            if (result.error) {
                alert("خطأ في تحليل الصورة: " + result.error)
            } else {
                setFormData({
                    title: result.title || '',
                    author: result.author || '',
                    isbn: result.isbn || '',
                    summary: result.summary || ''
                })
            }
        } catch (error) {
            console.error("Error uploading image:", error)
            alert("فشل في تحليل الصورة")
        } finally {
            setAnalyzing(false)
        }
    }

    const handleImageUpload = (e) => {
        const file = e.target.files[0]
        if (!file) return
        analyzeFile(file)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setErrors({})

        // Client-side validation
        const newErrors = {}
        if (!formData.title) newErrors.title = "يرجى إدخال عنوان الكتاب"
        if (!formData.author) newErrors.author = "يرجى إدخال اسم المؤلف"

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }

        try {
            await api.post('/books/', formData)
            navigate('/')
        } catch (error) {
            console.error("Error creating book:", error)
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
                alert("فشل في إضافة الكتاب: " + error.message)
            }
        }
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                    <div className="px-4 sm:px-0">
                        <h3 className="text-lg font-bold leading-6 text-gray-900">إضافة كتاب جديد</h3>
                        <p className="mt-2 text-sm text-gray-600">
                            يمكنك رفع صورة غلاف الكتاب أو التقاطها بالكاميرا ليقوم الذكاء الاصطناعي بتعبئة البيانات تلقائياً، أو إدخالها يدوياً.
                        </p>
                    </div>
                </div>
                <div className="mt-5 md:mt-0 md:col-span-2">
                    <div className="shadow-md overflow-hidden sm:rounded-xl bg-white border border-gray-100">
                        <div className="px-4 py-5 bg-white sm:p-6 space-y-6">

                            {/* Image Upload Section */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">صورة الغلاف</label>
                                <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-indigo-400 transition-colors bg-gray-50 hover:bg-gray-100 relative">
                                    <div className="space-y-1 text-center w-full">
                                        {image ? (
                                            <div className="relative">
                                                <img src={image} alt="Cover preview" className="mx-auto h-48 object-contain rounded-md shadow-sm" />
                                                <button
                                                    type="button"
                                                    onClick={() => setImage(null)}
                                                    className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ) : isCameraActive ? (
                                            <div className="relative">
                                                <video ref={videoRef} autoPlay playsInline className="mx-auto h-48 w-full object-cover rounded-md shadow-sm bg-black"></video>
                                                <div className="mt-2 flex justify-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={captureImage}
                                                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                                                    >
                                                        التقاط
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={stopCamera}
                                                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-full shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                                                    >
                                                        إلغاء
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                <div className="flex text-sm text-gray-600 justify-center flex-col sm:flex-row gap-2 items-center mt-2">
                                                    <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                                                        <span>رفع صورة</span>
                                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageUpload} accept="image/*" />
                                                    </label>
                                                    <span className="hidden sm:inline">أو</span>
                                                    <button
                                                        type="button"
                                                        onClick={startCamera}
                                                        className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none"
                                                    >
                                                        استخدام الكاميرا
                                                    </button>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF حتى 10MB</p>
                                            </>
                                        )}
                                    </div>
                                    {analyzing && (
                                        <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center rounded-lg z-10">
                                            <svg className="animate-spin h-8 w-8 text-indigo-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <p className="text-sm font-bold text-indigo-600">جاري تحليل الغلاف بالذكاء الاصطناعي...</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-6 gap-6">
                                    <div className="col-span-6 sm:col-span-4">
                                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">عنوان الكتاب</label>
                                        <input type="text" name="title" id="title" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2.5 border" />
                                        {errors.title && <p className="mt-1 text-xs text-red-600 font-semibold">{errors.title}</p>}
                                    </div>

                                    <div className="col-span-6 sm:col-span-4">
                                        <label htmlFor="author" className="block text-sm font-medium text-gray-700">المؤلف</label>
                                        <input type="text" name="author" id="author" required value={formData.author} onChange={e => setFormData({ ...formData, author: e.target.value })} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2.5 border" />
                                        {errors.author && <p className="mt-1 text-xs text-red-600 font-semibold">{errors.author}</p>}
                                    </div>

                                    <div className="col-span-6 sm:col-span-3">
                                        <label htmlFor="isbn" className="block text-sm font-medium text-gray-700">الرقم التسلسلي (ISBN)</label>
                                        <input type="text" name="isbn" id="isbn" value={formData.isbn} onChange={e => setFormData({ ...formData, isbn: e.target.value })} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2.5 border" />
                                        {errors.isbn && <p className="mt-1 text-xs text-red-600 font-semibold">{errors.isbn}</p>}
                                    </div>

                                    <div className="col-span-6">
                                        <label htmlFor="summary" className="block text-sm font-medium text-gray-700">ملخص</label>
                                        <textarea id="summary" name="summary" rows={4} value={formData.summary} onChange={e => setFormData({ ...formData, summary: e.target.value })} className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2.5" />
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button type="submit" className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-bold rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                                        حفظ الكتاب
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
