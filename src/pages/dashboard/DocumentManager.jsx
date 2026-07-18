import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderOpen, FileText, Image, File, UploadCloud, Search, 
  Trash2, Edit3, Download, Eye, Plus, ShieldAlert, Filter, 
  Loader2, Sparkles, Clock, X, Check, ArrowUpRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Medical Reports',
  'Prescriptions',
  'X-Rays',
  'MRI/CT Scans',
  'Insurance Documents',
  'Other'
];

export const DocumentManager = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Upload States
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadCategory, setUploadCategory] = useState('Medical Reports');
  const [dragActive, setDragActive] = useState(false);

  // Preview Modal State
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Rename Modal State
  const [renameDoc, setRenameDoc] = useState(null);
  const [newName, setNewName] = useState('');
  const [renaming, setRenaming] = useState(false);

  // Delete Modal State
  const [deleteDoc, setDeleteDoc] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch Patient Documents from database
  const fetchDocuments = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('patient_documents')
        .select('*')
        .eq('patient_id', user.id)
        .order('upload_date', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Handle Drag Over
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Upload File Logic
  const uploadFile = async (file) => {
    if (!user) {
      toast.error('Not authenticated');
      return;
    }

    // Validate size (max 20MB)
    const MAX_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error('File size exceeds the 20MB limit');
      return;
    }

    // Validate format
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only PDF, PNG, JPG, and JPEG are supported.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress smoothly
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 150);

    try {
      const fileExt = file.name.split('.').pop();
      const cleanFileName = file.name.replace(/[^\w\s.-]/gi, '');
      const storagePath = `${user.id}/${Date.now()}_${cleanFileName}`;

      // 1. Upload to Supabase Storage Bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        if (uploadError.message?.toLowerCase().includes('bucket not found') || uploadError.message?.toLowerCase().includes('bucket_not_found')) {
          throw new Error('Storage bucket "documents" not found. Please create a Private bucket named "documents" in your Supabase Dashboard -> Storage.');
        }
        throw uploadError;
      }

      // 2. Save metadata to database table
      const { error: dbError } = await supabase
        .from('patient_documents')
        .insert([{
          patient_id: user.id,
          file_name: file.name,
          file_url: storagePath, // we save the storage path as file_url so we can dynamically download/preview via signed URL
          category: uploadCategory,
          file_size: file.size
        }]);

      if (dbError) {
        // Rollback storage upload on DB error
        await supabase.storage.from('documents').remove([storagePath]);
        throw dbError;
      }

      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Delay success toast slightly to show 100% completion
      setTimeout(() => {
        toast.success('Document uploaded successfully!');
        fetchDocuments();
      }, 300);
    } catch (err) {
      clearInterval(progressInterval);
      console.error('Upload error:', err);
      toast.error(err.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  // Download File
  const handleDownload = async (doc) => {
    const toastId = toast.loading(`Preparing download for ${doc.file_name}...`);
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(doc.file_url);

      if (error) throw error;

      const blobUrl = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = doc.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast.success('Download started!', { id: toastId });
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to download file', { id: toastId });
    }
  };

  // Preview File
  const handlePreview = async (doc) => {
    setPreviewDoc(doc);
    setPreviewLoading(true);
    setPreviewUrl(null);
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(doc.file_url, 300); // 5 min expiry

      if (error) throw error;
      setPreviewUrl(data.signedUrl);
    } catch (err) {
      console.error('Preview error:', err);
      toast.error('Failed to load preview');
      setPreviewDoc(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Rename File
  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    if (!renameDoc || !newName.trim()) return;

    // Preserve extension if not explicitly specified
    let finalName = newName.trim();
    const originalExt = renameDoc.file_name.split('.').pop();
    const newExt = finalName.split('.').pop();
    if (originalExt && newExt !== originalExt) {
      finalName = `${finalName}.${originalExt}`;
    }

    setRenaming(true);
    try {
      const { error } = await supabase
        .from('patient_documents')
        .update({ file_name: finalName })
        .eq('id', renameDoc.id);

      if (error) throw error;

      toast.success('Document renamed successfully');
      setRenameDoc(null);
      fetchDocuments();
    } catch (err) {
      console.error('Rename error:', err);
      toast.error('Failed to rename document');
    } finally {
      setRenaming(false);
    }
  };

  // Delete File
  const handleDeleteSubmit = async () => {
    if (!deleteDoc) return;
    setDeleting(true);
    try {
      // 1. Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([deleteDoc.file_url]);

      if (storageError) {
        console.warn('Storage deletion warning (might already be deleted):', storageError);
      }

      // 2. Delete from DB metadata
      const { error: dbError } = await supabase
        .from('patient_documents')
        .delete()
        .eq('id', deleteDoc.id);

      if (dbError) throw dbError;

      toast.success('Document deleted successfully');
      setDeleteDoc(null);
      fetchDocuments();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete document');
    } finally {
      setDeleting(false);
    }
  };

  // Format Helper: File Size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format Helper: Date
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper to determine icon for document format/category
  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-5 h-5 text-red-400" />;
    if (['jpg', 'jpeg', 'png'].includes(ext || '')) return <Image className="w-5 h-5 text-cyan-400" />;
    return <File className="w-5 h-5 text-slate-400" />;
  };

  // Filter & Search computation
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.file_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Math Stats Breakdown
  const totalFilesCount = documents.length;
  const totalStorageBytes = documents.reduce((acc, doc) => acc + (parseInt(doc.file_size) || 0), 0);
  const categoryStats = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = documents.filter(doc => doc.category === cat).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#070b19] text-slate-100 p-6 md:p-8 rounded-3xl border border-white/5 relative overflow-hidden font-sans shadow-2xl">
      {/* Visual background details */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00f2fe05_1px,transparent_1px),linear-gradient(to_bottom,#00f2fe05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto relative z-10"
      >
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide flex items-center gap-1 shadow-[0_0_12px_rgba(99,102,241,0.15)]">
                <Sparkles className="w-3 h-3" /> Secure Storage
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
              Medical Documents
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl font-medium">
              Securely store and manage your healthcare records, prescriptions, imaging scans, and insurance cards. Accessible only by you.
            </p>
          </div>
        </div>

        {/* Storage Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="depth-card bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Total Records</span>
              <span className="text-2xl font-extrabold text-white mt-1 block">{totalFilesCount} Files</span>
            </div>
          </div>

          <div className="depth-card bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <UploadCloud className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Storage Used</span>
              <span className="text-2xl font-extrabold text-white mt-1 block">{formatFileSize(totalStorageBytes)}</span>
            </div>
          </div>

          <div className="depth-card bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Last Updated</span>
              <span className="text-sm font-semibold text-slate-200 mt-1 block">
                {documents.length > 0 ? formatDate(documents[0].upload_date) : 'No uploads yet'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left panel: Upload Area & Category Breakdown */}
          <div className="lg:col-span-4 space-y-6">
            <div className="depth-card bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-indigo-400" /> Upload New File
              </h3>

              {/* Category selector for upload */}
              <div className="mb-4">
                <label className="text-xs font-bold text-slate-400 block mb-2 uppercase tracking-wide">Document Category</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-sm text-slate-200 font-semibold focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Drag/Drop Box */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`relative flex flex-col items-center justify-center border border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                  dragActive 
                    ? 'border-indigo-500 bg-indigo-500/5' 
                    : 'border-white/15 hover:border-indigo-500/40 hover:bg-white/5'
                }`}
              >
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
                
                {isUploading ? (
                  <div className="w-full space-y-4">
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
                    <div>
                      <p className="text-sm font-semibold text-white">Uploading document...</p>
                      <p className="text-xs text-slate-400 mt-1">Please keep this tab open</p>
                    </div>
                    <div className="space-y-1">
                      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500" 
                          initial={{ width: 0 }} 
                          animate={{ width: `${uploadProgress}%` }} 
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                        <span>PROGRESS</span>
                        <span>{uploadProgress}%</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <UploadCloud className="w-8 h-8 text-indigo-400 mb-3 mx-auto animate-pulse" />
                    <p className="text-sm font-semibold text-white">Drag & drop document here</p>
                    <p className="text-xs text-slate-400 mt-1">or <span className="text-indigo-400 underline">Browse Files</span></p>
                    <p className="text-[10px] text-slate-500 mt-3 font-semibold uppercase tracking-wider">PDF, PNG, JPG, JPEG (Max 20MB)</p>
                  </label>
                )}
              </div>
            </div>

            {/* Category breakdown stats card */}
            <div className="depth-card bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Documents by Category</h4>
              <div className="space-y-3">
                {CATEGORIES.map(cat => {
                  const count = categoryStats[cat] || 0;
                  const pct = totalFilesCount > 0 ? (count / totalFilesCount) * 100 : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-300">{cat}</span>
                        <span className="text-slate-500">{count} files</span>
                      </div>
                      <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500" 
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right panel: Filter panel & Documents Grid */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Controls Bar: Search & Category Chips */}
            <div className="depth-card bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search files by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Horizontal Category Slider */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/10">
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === 'All'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  All Files ({totalFilesCount})
                </button>
                {CATEGORIES.map(cat => {
                  const count = categoryStats[cat] || 0;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300'
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Document list render */}
            {loading ? (
              <div className="depth-card bg-slate-900/30 border border-white/5 rounded-3xl p-16 flex flex-col items-center justify-center gap-4 min-h-[300px]">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                <p className="text-slate-400 text-sm font-semibold">Retrieving documents from secure cloud...</p>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="depth-card bg-slate-900/30 border border-white/5 rounded-3xl p-16 flex flex-col items-center justify-center text-center gap-4 min-h-[300px]">
                <FolderOpen className="w-12 h-12 text-slate-500" />
                <h3 className="text-lg font-bold text-white">No documents found</h3>
                <p className="text-slate-400 text-sm max-w-sm font-medium">
                  {searchQuery || selectedCategory !== 'All' 
                    ? 'Try adjusting your search query or category filters.'
                    : 'Get started by uploading your first medical document in the left panel.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredDocuments.map(doc => (
                    <motion.div
                      key={doc.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="depth-card bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:border-indigo-500/30 transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Upper row: icon, categories, menu action */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 shrink-0">
                              {getFileIcon(doc.file_name)}
                            </div>
                            <div>
                              <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 uppercase tracking-wide">
                                {doc.category}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setNewName(doc.file_name.split('.').slice(0, -1).join('.'));
                                setRenameDoc(doc);
                              }}
                              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                              title="Rename Document"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteDoc(doc)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/5 transition-colors cursor-pointer"
                              title="Delete Document"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Title / Description */}
                        <h4 className="text-sm font-bold text-white leading-snug line-clamp-2" title={doc.file_name}>
                          {doc.file_name}
                        </h4>
                      </div>

                      {/* Footer block: size, date, view, download */}
                      <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                        <div className="flex flex-col text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                          <span>{formatFileSize(doc.file_size)}</span>
                          <span className="text-slate-400 lowercase">{formatDate(doc.upload_date)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePreview(doc)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-indigo-500/15 border border-white/5 hover:border-indigo-500/35 text-slate-200 hover:text-white transition-all cursor-pointer"
                          >
                            <Eye className="w-3 h-3" /> Preview
                          </button>
                          <button
                            onClick={() => handleDownload(doc)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer shadow-sm"
                          >
                            <Download className="w-3 h-3" /> Download
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* General HIPAA Privacy Note */}
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">HIPAA Compliance & Privacy Guarantee</span>
                <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                  Medicare-AI implements state-of-the-art AES-256 server-side encryption for all files in Supabase Storage. Your records are accessed securely using authentication tokens and RLS rules. No clinicians or administrative staff can access these unless shared voluntarily.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* --- RENAME DIALOG --- */}
      <AnimatePresence>
        {renameDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setRenameDoc(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-white/10 rounded-2xl max-w-md w-full p-6 relative z-10 shadow-2xl"
            >
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-400" /> Rename Document
              </h3>
              <p className="text-xs text-slate-400 mb-4 font-semibold">
                Update display name for: <span className="text-slate-200">{renameDoc.file_name}</span>
              </p>

              <form onSubmit={handleRenameSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Enter new file name"
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRenameDoc(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={renaming}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-55"
                  >
                    {renaming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CONFIRM DELETE DIALOG --- */}
      <AnimatePresence>
        {deleteDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setDeleteDoc(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-white/10 rounded-2xl max-w-sm w-full p-6 relative z-10 shadow-2xl text-center"
            >
              <Trash2 className="w-10 h-10 text-rose-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">Delete Document?</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6 font-semibold">
                Are you sure you want to permanently delete <span className="text-slate-200">"{deleteDoc.file_name}"</span>? This action cannot be undone and will delete it from both our database and secure cloud storage.
              </p>

              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteDoc(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSubmit}
                  disabled={deleting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-55"
                >
                  {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Delete Forever
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- PREVIEW MODAL / LIGHTBOX --- */}
      <AnimatePresence>
        {previewDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
              onClick={() => setPreviewDoc(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-white/10 rounded-2xl max-w-4xl w-full p-4 relative z-10 shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Preview Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4 shrink-0">
                <div className="flex items-center gap-2 overflow-hidden">
                  {getFileIcon(previewDoc.file_name)}
                  <h3 className="text-sm font-bold text-white truncate" title={previewDoc.file_name}>
                    {previewDoc.file_name}
                  </h3>
                </div>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Preview Body Area */}
              <div className="flex-1 overflow-y-auto min-h-[400px] flex items-center justify-center bg-slate-950/40 rounded-xl border border-white/5 relative p-4">
                {previewLoading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                    <p className="text-xs text-slate-400 font-bold">Creating secure viewer link...</p>
                  </div>
                ) : previewUrl ? (
                  previewDoc.file_name.split('.').pop()?.toLowerCase() === 'pdf' ? (
                    <iframe
                      src={`${previewUrl}#toolbar=0`}
                      className="w-full h-[60vh] rounded-lg bg-white"
                      title={previewDoc.file_name}
                    />
                  ) : (
                    <img
                      src={previewUrl}
                      alt={previewDoc.file_name}
                      className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-lg"
                    />
                  )
                ) : (
                  <div className="text-center text-slate-400">
                    <ShieldAlert className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                    <p className="text-xs font-semibold">Failed to generate preview URL.</p>
                  </div>
                )}
              </div>

              {/* Preview Footer Actions */}
              <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center shrink-0">
                <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  {previewDoc.category} &bull; {formatFileSize(previewDoc.file_size)}
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-200 transition-colors cursor-pointer"
                  >
                    Open in new tab <ArrowUpRight className="w-3 h-3" />
                  </a>
                  <button
                    onClick={() => handleDownload(previewDoc)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
                  >
                    <Download className="w-3 h-3" /> Download
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
